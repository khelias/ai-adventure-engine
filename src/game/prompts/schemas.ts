// JSON schemas for the four response shapes the AI produces. Kept pure —
// no prompt text, no composition logic. The proxy's allowlist is keyed off
// exact canonical schema hashes; run `npm run schema:hashes` after changing
// any schema here and update proxy/server.js with the new hashes.

import type { JsonSchema } from '../../api/adventure'

const parameterItem: JsonSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    states: { type: 'ARRAY', items: { type: 'STRING' } },
    archetype: { type: 'STRING' },
  },
  required: ['name', 'states', 'archetype'],
}

const roleItem: JsonSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    description: { type: 'STRING' },
    ability: { type: 'STRING' },
    abilityParameter: { type: 'STRING' },
  },
  required: ['name', 'description', 'ability', 'abilityParameter'],
}

export const storyGenerationSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    stories: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          summary: { type: 'STRING' },
          roles: { type: 'ARRAY', items: roleItem },
          parameters: { type: 'ARRAY', items: parameterItem },
        },
        required: ['title', 'summary', 'roles', 'parameters'],
      },
    },
  },
  required: ['stories'],
}

export const customStorySchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    roles: { type: 'ARRAY', items: roleItem },
    parameters: { type: 'ARRAY', items: parameterItem },
  },
  required: ['roles', 'parameters'],
}

export const sequelSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    newAbilities: { type: 'ARRAY', items: { type: 'STRING' } },
    newAbilityParameters: { type: 'ARRAY', items: { type: 'STRING' } },
    newParameters: { type: 'ARRAY', items: parameterItem },
  },
  required: ['newAbilities', 'newAbilityParameters', 'newParameters'],
}

export const turnSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    scene: { type: 'STRING' },
    parameters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          change: { type: 'INTEGER' },
        },
        required: ['name', 'change'],
      },
    },
    choices: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING' },
          isAbility: { type: 'BOOLEAN' },
          actor: { type: 'INTEGER' },
          target: { type: 'INTEGER' },
          expectedChanges: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                change: { type: 'INTEGER' },
              },
              required: ['name', 'change'],
            },
          },
        },
        required: ['text', 'isAbility', 'expectedChanges'],
      },
    },
    consequences: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          parameterName: { type: 'STRING' },
          text: { type: 'STRING' },
        },
        required: ['parameterName', 'text'],
      },
    },
    gameOver: { type: 'BOOLEAN' },
    gameOverText: { type: 'STRING' },
  },
  required: ['scene', 'parameters', 'choices', 'consequences', 'gameOver'],
}

export interface TurnResponse {
  scene: string
  parameters: { name: string; change: number }[]
  choices: import('../types').Choice[]
  consequences: { parameterName: string; text: string }[]
  gameOver: boolean
  gameOverText?: string
}
