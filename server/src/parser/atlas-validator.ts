import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { AtlasAstType, Gamepack, Recipe } from './ast.js';
import type { AtlasServices } from './atlas-module.js';

export function registerValidationChecks(services: AtlasServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.AtlasValidator;
    const checks: ValidationChecks<AtlasAstType> = {
        Gamepack: validator.checkGamepackHasGame,
        Recipe: validator.checkRecipeHasInputsAndOutputs,
    };
    registry.register(checks, validator);
}

export class AtlasValidator {

    checkGamepackHasGame(gamepack: Gamepack, accept: ValidationAcceptor): void {
        if (gamepack.gameName.length === 0) {
            accept('error', 'Gamepack must declare a game name with game: "..."', { node: gamepack });
        }
    }

    checkRecipeHasInputsAndOutputs(recipe: Recipe, accept: ValidationAcceptor): void {
        if (recipe.inputs.length === 0) {
            accept('warning', 'Recipe has no inputs.', { node: recipe });
        }
        if (recipe.outputs.length === 0) {
            accept('warning', 'Recipe has no outputs.', { node: recipe });
        }
    }

}
