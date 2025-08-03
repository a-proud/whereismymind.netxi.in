<?php

namespace App\Service\AI;

class PromptBuilderService
{
    protected array $prompts = [];
    protected array $modificators = [];
    protected string $userPrompt;
    protected string $providerName;

    public function __construct(string $userPrompt, string $providerName = 'default', array $prompts)
    {
        $this->userPrompt = $userPrompt;
        $this->providerName = $providerName;
        $this->prompts = $prompts;
        //$this->initPrompts();
    }

    /*protected function initPrompts(): void
    {
        $this->prompts = 
    }*/

    public function getPrompt(string $key, string $model = 'default'): string
    {
        if (!isset($this->prompts[$key])) {
            throw new \InvalidArgumentException("Prompt key '$key' not found");
        }
        
        $modelPrompts = $this->prompts[$key];
        
        // Check if it's a nested structure (like format.simple_qna)
        if (is_array($modelPrompts) && isset($modelPrompts[$model]) && is_array($modelPrompts[$model])) {
            return $modelPrompts[$model][$this->providerName] ?? $modelPrompts[$model]['default'];
        }
        
        // Direct structure
        return $modelPrompts[$model] ?? $modelPrompts['default'];
    }

    public function addModifier(string $modifierKey, string $value = null): self
    {
        if ($value) {
            // Nested structure: format.simple_qna
            $this->modificators[] = $this->getPrompt($modifierKey, $value);
        } else {
            // Direct structure: language.ru
            $this->modificators[] = $this->getPrompt($modifierKey);
        }
        return $this;
    }

    public function build(): string
    {
        return $this->userPrompt . "\n\n" . implode("\n\n", $this->modificators);
    }
} 