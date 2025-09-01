export type SupportedAssistant = 'claude' | 'gemini';

export interface AssistantValidationResult {
  valid: boolean;
  assistants: SupportedAssistant[];
  errors: string[];
}

const SUPPORTED_ASSISTANTS: SupportedAssistant[] = ['claude', 'gemini'];

export function validateAssistants(input: string): AssistantValidationResult {
  const result: AssistantValidationResult = {
    valid: false,
    assistants: [],
    errors: [],
  };

  // Handle empty or undefined input
  if (!input || typeof input !== 'string') {
    result.errors.push('Assistant input cannot be empty or undefined');
    return result;
  }

  // Handle whitespace-only input
  if (input.trim() === '') {
    result.errors.push('Assistant input cannot be empty or contain only whitespace');
    return result;
  }

  // Handle inputs that are just separators
  if (input.trim() === ',' || /^,+$/.test(input.trim())) {
    result.errors.push('Assistant input cannot contain only commas');
    return result;
  }

  // Split by comma and normalize
  const rawAssistants = input
    .split(',')
    .map(name => name.trim().toLowerCase())
    .filter(name => name.length > 0);

  // Handle case where all entries were empty after trimming
  if (rawAssistants.length === 0) {
    result.errors.push('No valid assistant names found in input (only commas and whitespace detected)');
    return result;
  }

  // Remove duplicates while preserving order
  const uniqueAssistants: string[] = [];
  const seen = new Set<string>();
  for (const assistant of rawAssistants) {
    if (!seen.has(assistant)) {
      seen.add(assistant);
      uniqueAssistants.push(assistant);
    }
  }

  // Validate each assistant name
  const validAssistants: SupportedAssistant[] = [];
  const invalidNames: string[] = [];

  for (const assistant of uniqueAssistants) {
    if (SUPPORTED_ASSISTANTS.includes(assistant as SupportedAssistant)) {
      validAssistants.push(assistant as SupportedAssistant);
    } else {
      invalidNames.push(assistant);
    }
  }

  // Add errors for invalid names with specific suggestions
  if (invalidNames.length > 0) {
    const invalidNamesStr = invalidNames.join(', ');
    const supportedNamesStr = SUPPORTED_ASSISTANTS.join(', ');
    
    // Check for common misspellings and provide suggestions
    const suggestions: string[] = [];
    for (const invalidName of invalidNames) {
      if (['claud', 'claude-ai', 'anthropic'].includes(invalidName)) {
        suggestions.push(`Did you mean "claude" instead of "${invalidName}"?`);
      } else if (['gemeni', 'google', 'bard'].includes(invalidName)) {
        suggestions.push(`Did you mean "gemini" instead of "${invalidName}"?`);
      }
    }
    
    let errorMessage = `Invalid assistant name${invalidNames.length > 1 ? 's' : ''}: ${invalidNamesStr}. ` +
      `Supported assistants: ${supportedNamesStr}`;
    
    if (suggestions.length > 0) {
      errorMessage += '. ' + suggestions.join('. ');
    }
    
    result.errors.push(errorMessage);
  }

  // Set result
  result.assistants = validAssistants;
  result.valid = validAssistants.length > 0 && invalidNames.length === 0;

  return result;
}
