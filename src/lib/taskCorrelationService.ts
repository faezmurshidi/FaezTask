import { CommitMetadata, CommitTaskCorrelation, TaskCorrelationService, CorrelationOptions } from '../types';

/**
 * Task Correlation Service
 * 
 * Correlates git commits with project tasks using various methods:
 * - Regex pattern matching (current implementation)
 * - Mock AI analysis (placeholder for future integration)
 * - File change analysis
 * - Semantic understanding (future AI feature)
 */
export class TaskCorrelationServiceImpl implements TaskCorrelationService {
  
  // Common regex patterns for task references in commit messages
  private taskPatterns = [
    // Direct task references: "task 27.6", "Task 27.6", "TASK 27.6"
    /(?:task|fix|close|resolve|complete|implement|work\s+on)[s]?\s*[:#]?\s*(\d+(?:\.\d+)?)/gi,
    // Hash references: "#27.6", "#27"
    /#(\d+(?:\.\d+)?)/g,
    // Subtask references: "27.6", "subtask 27.6"
    /(?:subtask|sub)[s]?\s*[:#]?\s*(\d+\.\d+)/gi,
    // Direct ID patterns: "27.6" (standalone)
    /\b(\d+\.\d+)\b/g,
    // Issue/ticket patterns: "fixes #27", "closes task 27.6"
    /(?:fixes|closes|resolves|addresses)[s]?\s*[:#]?\s*(\d+(?:\.\d+)?)/gi
  ];

  // Keywords that indicate different progress states
  private progressKeywords = {
    started: ['start', 'begin', 'initial', 'setup', 'create', 'add', 'implement'],
    'in-progress': ['update', 'modify', 'change', 'improve', 'refactor', 'enhance', 'work'],
    completed: ['fix', 'complete', 'finish', 'done', 'resolve', 'close', 'final']
  };

  /**
   * Analyze commit and correlate with tasks
   */
  async analyzeCommitTaskCorrelation(
    commit: CommitMetadata,
    availableTasks: any[] = [],
    options: CorrelationOptions = {}
  ): Promise<CommitTaskCorrelation> {
    const timestamp = new Date().toISOString();
    
    // Extract task references using regex
    const taskReferences = this.getTaskReferences(commit.message);
    
    if (taskReferences.length === 0) {
      // No direct task references found - future AI enhancement point
      if (options.useAI) {
        return await this.mockAIAnalysis(commit, availableTasks, options);
      }
      
      return {
        commitHash: commit.hash,
        taskId: null,
        confidence: 0.0,
        method: 'regex',
        reasoning: 'No task references found in commit message',
        progressEstimate: 'unknown',
        suggestedAction: 'none',
        timestamp
      };
    }

    // Use the first (most likely) task reference
    const primaryTaskId = taskReferences[0];
    const confidence = this.calculateConfidence(commit, primaryTaskId, taskReferences.length);
    const progressEstimate = this.estimateProgress(commit.message);
    const suggestedAction = this.determineSuggestedAction(progressEstimate, confidence);

    return {
      commitHash: commit.hash,
      taskId: primaryTaskId,
      confidence,
      method: 'regex',
      reasoning: `Found task reference "${primaryTaskId}" in commit message using regex pattern matching`,
      progressEstimate,
      suggestedAction,
      timestamp
    };
  }

  /**
   * Extract task references from commit message
   */
  getTaskReferences(commitMessage: string): string[] {
    const references = new Set<string>();
    
    for (const pattern of this.taskPatterns) {
      const matches = commitMessage.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          references.add(match[1]);
        }
      }
    }
    
    return Array.from(references);
  }

  /**
   * Calculate confidence score based on various factors
   */
  private calculateConfidence(
    commit: CommitMetadata,
    taskId: string,
    referenceCount: number
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for explicit task references
    if (commit.message.toLowerCase().includes('task')) confidence += 0.2;
    if (commit.message.toLowerCase().includes('fix')) confidence += 0.1;
    if (commit.message.toLowerCase().includes('complete')) confidence += 0.2;
    
    // Multiple references increase confidence
    if (referenceCount > 1) confidence += 0.1;
    
    // Subtask references (e.g., 27.6) are more specific
    if (taskId.includes('.')) confidence += 0.1;
    
    // File changes can indicate relevance (future enhancement)
    if (commit.filesChanged && commit.filesChanged.length > 0) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Estimate progress based on commit message keywords
   */
  private estimateProgress(commitMessage: string): CommitTaskCorrelation['progressEstimate'] {
    const message = commitMessage.toLowerCase();
    
    // Check for completion indicators first (highest priority)
    if (this.progressKeywords.completed.some(keyword => message.includes(keyword))) {
      return 'completed';
    }
    
    // Check for start indicators
    if (this.progressKeywords.started.some(keyword => message.includes(keyword))) {
      return 'started';
    }
    
    // Check for progress indicators
    if (this.progressKeywords['in-progress'].some(keyword => message.includes(keyword))) {
      return 'in-progress';
    }
    
    return 'unknown';
  }

  /**
   * Determine suggested action based on progress and confidence
   */
  private determineSuggestedAction(
    progress: CommitTaskCorrelation['progressEstimate'],
    confidence: number
  ): CommitTaskCorrelation['suggestedAction'] {
    if (confidence < 0.5) return 'none';
    
    switch (progress) {
      case 'completed':
        return confidence > 0.7 ? 'update-status' : 'add-progress';
      case 'started':
      case 'in-progress':
        return 'add-progress';
      default:
        return 'none';
    }
  }

  /**
   * Mock AI analysis - placeholder for future AI integration
   */
  private async mockAIAnalysis(
    commit: CommitMetadata,
    availableTasks: any[],
    options: CorrelationOptions
  ): Promise<CommitTaskCorrelation> {
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock semantic analysis based on file changes and commit content
    const hasRelevantFiles = commit.filesChanged?.some(file => 
      file.includes('git') || file.includes('Git') || 
      file.includes('commit') || file.includes('correlation')
    );
    
    if (hasRelevantFiles && commit.message.toLowerCase().includes('correlation')) {
      return {
        commitHash: commit.hash,
        taskId: '27.7', // This would be determined by AI
        confidence: 0.8,
        method: 'ai',
        reasoning: '[MOCK AI] Semantic analysis detected git correlation functionality based on file changes and commit content',
        progressEstimate: 'in-progress',
        suggestedAction: 'add-progress',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      commitHash: commit.hash,
      taskId: null,
      confidence: 0.0,
      method: 'ai',
      reasoning: '[MOCK AI] No semantic correlation found with available tasks',
      progressEstimate: 'unknown',
      suggestedAction: 'none',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update task progress based on correlation (placeholder)
   */
  async updateTaskProgress(correlation: CommitTaskCorrelation): Promise<boolean> {
    if (!correlation.taskId || correlation.confidence < 0.5) {
      return false;
    }

    // This would integrate with the task management system
    console.log(`[CORRELATION] Would update task ${correlation.taskId}:`, {
      action: correlation.suggestedAction,
      progress: correlation.progressEstimate,
      confidence: correlation.confidence,
      commit: correlation.commitHash
    });
    
    // Future implementation: actual task status updates
    return true;
  }
}

// Export singleton instance
export const taskCorrelationService = new TaskCorrelationServiceImpl(); 