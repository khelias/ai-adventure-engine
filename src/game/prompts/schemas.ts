// JSON schemas for the four response shapes the AI produces. Kept pure —
// no prompt text, no composition logic. The proxy's allowlist is keyed off
// the sorted top-level `properties` names, so the shape fingerprints are:
//   storyGenerationSchema → "stories"
//   customStorySchema     → "parameters,roles"
//   sequelSchema          → "newAbilities,newParameters"
//   turnSchema            → "choices,gameOver,gameOverText,parameters,scene"
// Do not rename top-level keys without also updating ALLOWED_SCHEMA_SHAPES
// in proxy/server.js.

import type { JsonSchema } from '../../api/adventure'

const parameterItem: JsonSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    states: { type: 'ARRAY', items: { type: 'STRING' } },
    archetype: { type: 'STRING' },
    ownerRoleId: { type: 'INTEGER' },
  },
  required: ['name', 'states', 'archetype'],
}

const roleItem: JsonSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    description: { type: 'STRING' },
    ability: { type: 'STRING' },
  },
  required: ['name', 'description', 'ability'],
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
    newParameters: { type: 'ARRAY', items: parameterItem },
  },
  required: ['newAbilities', 'newParameters'],
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
        required: ['text', 'isAbility', 'actor', 'expectedChanges'],
      },
    },
    gameOver: { type: 'BOOLEAN' },
    gameOverText: { type: 'STRING' },
  },
  required: ['scene', 'parameters', 'choices', 'gameOver'],
}

export interface TurnResponse {
  scene: string
  parameters: { name: string; change: number }[]
  choices: import('../types').Choice[]
  gameOver: boolean
  gameOverText?: string
}
