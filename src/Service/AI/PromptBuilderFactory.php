<?php

namespace App\Service\AI;

class PromptBuilderFactory
{
    public function __construct(private array $prompts)
    {
    }

    public function create(string $userPrompt, string $providerName = 'default'): PromptBuilderService
    {
        return new PromptBuilderService($userPrompt, $providerName, $this->prompts);
    }
} 