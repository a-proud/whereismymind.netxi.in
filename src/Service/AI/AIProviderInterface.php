<?php

namespace App\Service\AI;

interface AIProviderInterface
{
    public function request(string $prompt): string;
    
    public function getName(): string;
} 