<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/nodes')]
final class NodeController extends AbstractController
{
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
        // Get data from request
        $data = json_decode($request->getContent(), true);
        
        // Log received data for debugging
        error_log('Received AI request: ' . json_encode($data, JSON_PRETTY_PRINT));
        
        // Mock response with question and options
        $mockResponse = [
            'status' => 'success',
            'question' => 'What type of application are you building?',
            'options' => [
                'Web application',
                'Mobile application', 
                'Desktop application',
                'API/Backend service'
            ],
            'node_id' => $data['node_id'] ?? null,
            'response_type' => $data['response_type'] ?? 'options'
        ];
        
        return new JsonResponse($mockResponse);
    }
} 