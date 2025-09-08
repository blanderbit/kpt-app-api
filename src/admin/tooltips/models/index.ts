import { SwipeModel } from './swipe.model';
import { TextModel } from './text.model';

export { SwipeModel, TextModel };

// Union type for all tooltip models
export type TooltipModel = SwipeModel | TextModel;

// Type guard functions
export function isSwipeModel(model: any): model is SwipeModel {
  return model && typeof model === 'object' && 'steps' in model && Array.isArray(model.steps);
}

export function isTextModel(model: any): model is TextModel {
  return model && typeof model === 'object' && 'description' in model && !('steps' in model);
}
