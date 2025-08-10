<?php

namespace App\Service\AI;

class GeminiAIProvider implements AIProviderInterface
{
    private string $apiKey;

    public function __construct(string $geminiApiKey)
    {
        $this->apiKey = $geminiApiKey;
    }

    public function request(string $prompt): string
    {
        $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
        
        $data = [
            "contents" => [
                [
                    "parts" => [
                        [
                            "text" => $prompt
                        ]
                    ]
                ]
            ]
        ];

        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "X-goog-api-key: " . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $response = curl_exec($ch);
        curl_close($ch);
        
        if (!$response) {
            throw new \Exception('Failed to get response from Gemini API');
        }
        
        $responseData = json_decode($response, true);
        
        if (isset($responseData['error'])) {
            throw new \Exception('Gemini API error: ' . ($responseData['error']['message'] ?? 'Unknown error'));
        }
        
        if (!isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception('Invalid response format from Gemini API');
        }
        
        return $responseData['candidates'][0]['content']['parts'][0]['text'];
    }
    
    public function getName(): string
    {
        return 'gemini';
    }
} 