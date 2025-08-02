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
} 