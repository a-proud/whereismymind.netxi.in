<?php

namespace App\Service\AI;

class AIService
{
    private array $providers = [];
    private ?string $currentProvider = null;
    
    public function __construct(
        private PromptBuilderFactory $promptBuilderFactory
    ) {}
    
    public function addProvider(AIProviderInterface $provider): void
    {
        $this->providers[$provider->getName()] = $provider;
    }
    
    public function request(string $userPrompt): string
    {
        if (!$this->currentProvider) {
            throw new \InvalidArgumentException("No provider set. Use buildPrompt() first.");
        }
        
        if (!isset($this->providers[$this->currentProvider])) {
            throw new \InvalidArgumentException("AI provider '$this->currentProvider' not found");
        }
        
        return $this->providers[$this->currentProvider]->request($userPrompt);
    }
    
    public function buildPrompt(string $userPrompt, string $providerName = 'default'): PromptBuilderService
    {
        $this->currentProvider = $providerName;
        return $this->promptBuilderFactory->create($userPrompt, $providerName);
    }
    
    public function getAvailableProviders(): array
    {
        return array_keys($this->providers);
    }
} 