<?php

namespace App\Controller;

use App\Service\AI\AIService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use App\Service\AI\PromptBuilderService;

#[Route('/api/nodes')]
final class NodeController extends AbstractController
{
    public function __construct(
        private AIService $aiService
    ) {}
    #[Route('/save', name: 'api_node_save', methods: ['POST'])]
    public function saveNode(Request $request): JsonResponse
    {
        // Get data from request
        $data = json_decode($request->getContent(), true);
        
        // Log received data for debugging
        error_log('Received node data: ' . json_encode($data, JSON_PRETTY_PRINT));
        
        // Return received data back for verification
        return new JsonResponse([
            'status' => 'success',
            'message' => 'Data received successfully',
            'received_data' => $data,
            'timestamp' => new \DateTime()
        ]);
    }

    #[Route('/ai-request', name: 'api_ai_request', methods: ['POST'])]
    public function aiRequest(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \InvalidArgumentException('Invalid JSON in request body');
            }

            $userPrompt = ($data['body'] ?? '') . ' ' . ($data['context'] ?? '');
            
            // Handle cascading contexts with priorities
            $contexts = $data['contexts'] ?? [];
            if (!empty($contexts)) {
                $contextModifier = '';
                foreach ($contexts as $ctx) {
                    if (isset($ctx['context']) && isset($ctx['priority'])) {
                        $contextModifier .= "Приоритет {$ctx['priority']}: {$ctx['context']}\n";
                    }
                }
                if ($contextModifier) {
                    $userPrompt = $contextModifier . "\n" . $userPrompt;
                }
            }
            
            $prompt = $this->aiService->buildPrompt($userPrompt, $data['provider_name'] ?? 'groq')
                ->addModifier('response_type', $data['response_type'])
                ->addModifier('language', 'ru')
                ->build();

            $aiResponse = $this->aiService->request($prompt);

            // If aiResponse is already an array (from other providers), wrap it
            if (is_array($aiResponse) && !isset($aiResponse['questions'])) {
                $aiResponse = ['questions' => $aiResponse];
            }



            if (($data['response_type'] ?? null) === 'thesis_extract') {
                // Build prompt with explicit JSON input wrapper to reduce LLM confusion
                $raw = (string)($data['body'] ?? '');
                $inputWrapper = json_encode(['text' => $raw], JSON_UNESCAPED_UNICODE);
                
                // Add contexts to the input wrapper
                $contexts = $data['contexts'] ?? [];
                if (!empty($contexts)) {
                    $inputWrapper = json_encode([
                        'text' => $raw,
                        'contexts' => $contexts
                    ], JSON_UNESCAPED_UNICODE);
                }
                
                $prompt = $this->aiService->buildPrompt($inputWrapper, $data['provider_name'] ?? 'groq')
                    ->addModifier('response_type', 'thesis_extract')
                    ->addModifier('language', 'ru')
                    ->build();

                $rawResp = $this->aiService->request($prompt);
                $decoded = json_decode(trim($rawResp), true);
                $label = null;
                $theses = [];
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    // New object format: { label: string, theses: [{text, summary}] }
                    if (isset($decoded['theses']) && is_array($decoded['theses'])) {
                        foreach ($decoded['theses'] as $item) {
                            if (is_array($item)) {
                                $theses[] = [
                                    'text' => isset($item['text']) ? (string)$item['text'] : '',
                                    'summary' => isset($item['summary']) ? (string)$item['summary'] : '',
                                ];
                            }
                        }
                    } else {
                        // Backward compatibility: array of items
                        foreach ($decoded as $item) {
                            if (is_array($item)) {
                                $theses[] = [
                                    'text' => isset($item['text']) ? (string)$item['text'] : '',
                                    'summary' => isset($item['summary']) ? (string)$item['summary'] : '',
                                ];
                            }
                        }
                    }
                    if (isset($decoded['label']) && is_string($decoded['label'])) {
                        $label = (string)$decoded['label'];
                    }
                }
                
                // Fallback: if no label was extracted, generate one from the first thesis or raw text
                if (empty($label)) {
                    if (!empty($theses) && !empty($theses[0]['summary'])) {
                        $label = $theses[0]['summary'];
                    } elseif (!empty($raw)) {
                        // Extract first few meaningful words from raw text
                        $words = preg_split('/\s+/', trim($raw));
                        $label = implode(' ', array_slice($words, 0, 4));
                    } else {
                        $label = 'Новый узел';
                    }
                }
                $aiResponse = ['theses' => $theses, 'meta' => ['label' => $label]];
            }

            // For 'text' response type, handle chat with history
            if (($data['response_type'] ?? null) === 'text') {
                $chatHistory = $data['chat_history'] ?? [];
                
                // If we have chat history, format it as a conversation for all providers
                if (!empty($chatHistory)) {
                    $conversation = '';
                    foreach ($chatHistory as $message) {
                        $role = $message['role'] ?? 'user';
                        $content = $message['content'] ?? '';
                        if ($role === 'user') {
                            $conversation .= "User: " . $content . "\n";
                        } else {
                            $conversation .= "Assistant: " . $content . "\n";
                        }
                    }
                    $conversation .= "User: " . $userPrompt . "\n";
                    
                    $prompt = $this->aiService->buildPrompt($conversation, $data['provider_name'] ?? 'groq')
                        ->addModifier('response_type', 'text')
                        ->addModifier('language', 'ru')
                        ->build();
                    
                    $aiResponse = $this->aiService->request($prompt);
                }
                
                $aiResponse = ['text' => (string)$aiResponse];
            }

            $response = [
                'status' => 'success',
                'questions' => $aiResponse['questions'] ?? [],
                'theses' => $aiResponse['theses'] ?? null,
                'meta' => $aiResponse['meta'] ?? null,
                'text' => $aiResponse['text'] ?? null,
                'response' => $aiResponse['text'] ?? null, // Backward compatibility
                'node_id' => $data['node_id'] ?? null,
                'response_type' => $data['response_type'] ?? 'options'
            ];
            
            return new JsonResponse($response);
            
        } catch (\Exception $e) {
            error_log('AI request error: ' . $e->getMessage());
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Internal server error: ' . $e->getMessage(),
                'node_id' => $data['node_id'] ?? null,
                'response_type' => $data['response_type'] ?? 'unknown'
            ], 500);
        }
    }

    #[Route('/ai-providers', name: 'api_ai_providers', methods: ['GET'])]
    public function getAIProviders(): JsonResponse
    {
        try {
            $providers = $this->aiService->getAvailableProviders();
            return new JsonResponse([
                'status' => 'success',
                'providers' => $providers
            ]);
        } catch (\Exception $e) {
            error_log('Get AI providers error: ' . $e->getMessage());
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Failed to get AI providers: ' . $e->getMessage()
            ], 500);
        }
    }
} 