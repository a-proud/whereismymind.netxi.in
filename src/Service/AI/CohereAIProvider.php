<?php

namespace App\Service\AI;

class CohereAIProvider implements AIProviderInterface
{

    private string $apiKey;

    public function __construct(string $cohereApiKey)
    {
        $this->apiKey = $cohereApiKey;
    }

    public function request(string $prompt): string
    {
        $history = [];
        $url = 'https://api.cohere.com/v1/chat';
        $headers = [
            'Authorization: Bearer '.$this->apiKey,
            'Content-Type: application/json'
        ];
        $data = [
            "message" => $prompt,
            "stream" => false,
            "chat_history" => $history,
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $response = curl_exec($ch);
        curl_close($ch);

        if (!$response) {
            throw new \Exception('Failed to get response from Cohere API');
        }

        $responseData = json_decode($response, true);
        $aiText = $responseData['text'] ?? '';
        
        return $aiText;
    }
    
    public function getName(): string
    {
        return 'cohere';
    }
} 