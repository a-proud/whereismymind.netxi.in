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
        $data = json_decode($request->getContent(), true);

        $userPrompt = ($data['body'] ?? '') . ' ' . ($data['context'] ?? '');
        
        $prompt = $this->aiService->buildPrompt($userPrompt, $data['provider_name'] ?? 'groq')
            ->addModifier('response_type', $data['response_type'])
            ->addModifier('language', 'ru')
            ->build();

        $aiResponse = $this->aiService->request($prompt);

        // If aiResponse is already an array (from other providers), wrap it
        if (is_array($aiResponse) && !isset($aiResponse['questions'])) {
            $aiResponse = ['questions' => $aiResponse];
        }

        if ($data['response_type'] == 'simple_qna') {
            $questions = [];
            $questionId = 1;
            $aiResponse = preg_replace('/^.*?(Q:)/s', '$1', $aiResponse);
            // Split by question blocks (Q: ...)
            preg_match_all('/Q:\s*((?:(?!^\s*Q:\s).*\n?)*)/mu', $aiResponse, $questionBlocks);
            
            foreach ($questionBlocks[1] as $block) {
                $lines = explode("\n", trim($block));
                $question = trim($lines[0] ?? '');
                $options = [];
                for ($i = 1; $i < count($lines); $i++) {
                    $line = trim($lines[$i]);
                    if (preg_match('/^\s*-\s*(.+)$/', $line, $match)) {
                        $options[] = trim($match[1]);
                    }
                }
                if ($question && !empty($options)) {
                    $questions[] = [
                        'id' => $questionId++,
                        'question' => $question,
                        'options' => array_merge($options, ['Next ->'])
                    ];
                }
            }
            
            $aiResponse = ['questions' => $questions];
        }

        $response = [
            'status' => 'success',
            'questions' => $aiResponse['questions'] ?? [],
            'node_id' => $data['node_id'] ?? null,
            'response_type' => $data['response_type'] ?? 'options'
        ];
        
        return new JsonResponse($response);
    }
} 