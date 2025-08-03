<?php

namespace App\Service\AI;

class GroqAIProvider implements AIProviderInterface
{
    private string $apiKey;

    public function __construct(string $groqApiKey)
    {
        $this->apiKey = $groqApiKey;
    }

    public function request(string $prompt): string
    {
        $apiUrl = "https://api.groq.com/openai/v1/chat/completions";
        $apiKey = $this->apiKey;

        $data = [
            "messages" => [
                [
                    "role" => "user",
                    "content" => $prompt,
                ]
            ],
            "model" => "llama3-8b-8192"
        ];

        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $apiKey",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $response = curl_exec($ch);
        curl_close($ch);
        if (!$response) {
            throw new \Exception('Failed to get response from Groq API');
        }
        
        return json_decode($response)->choices[0]->message->content;
    }
    
    public function getName(): string
    {
        return 'groq';
    }
} 