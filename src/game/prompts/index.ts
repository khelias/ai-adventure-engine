// Public API for the prompts subsystem. Callers import from
// '../game/prompts' and should not reach into submodules directly — the
// submodule boundary is kept internal so we can restructure without
// churning the rest of the codebase.

export {
  storyGenerationSchema,
  customStorySchema,
  sequelSchema,
  turnSchema,
  type TurnResponse,
} from './schemas'

export {
  storyGenerationPrompt,
  customStoryPrompt,
  sequelPrompt,
} from './story-gen'

export {
  turnPrompt,
  type TurnPromptResult,
} from './turn'

export {
  getStoryPhase,
  type StoryPhase,
} from './phases'
