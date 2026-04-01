/******************************************************************************
 * Adapted from processr-atlas.
 ******************************************************************************/

import { type Module, inject, type AstNode, DefaultNameProvider } from 'langium';
import { createDefaultModule, createDefaultSharedModule, type DefaultSharedModuleContext, type LangiumServices, type LangiumSharedServices, type PartialLangiumServices } from 'langium/lsp';
import { AtlasGeneratedModule, AtlasGeneratedSharedModule } from './module.js';
import { AtlasValidator, registerValidationChecks } from './atlas-validator.js';
import { isCategory, isItem, isNodeTemplate, isRecipe } from './ast.js';

class AtlasNameProvider extends DefaultNameProvider {
    override getName(node: AstNode): string | undefined {
        if (isCategory(node))     return node.id;
        if (isItem(node))         return node.id;
        if (isNodeTemplate(node)) return node.id;
        if (isRecipe(node))       return node.id;
        return super.getName(node);
    }
}

export type AtlasAddedServices = {
    validation: {
        AtlasValidator: AtlasValidator
    }
}

export type AtlasServices = LangiumServices & AtlasAddedServices

export const AtlasModule: Module<AtlasServices, PartialLangiumServices & AtlasAddedServices> = {
    references: {
        NameProvider: () => new AtlasNameProvider()
    },
    validation: {
        AtlasValidator: () => new AtlasValidator()
    }
};

export function createAtlasServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    Atlas: AtlasServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        AtlasGeneratedSharedModule
    );
    const Atlas = inject(
        createDefaultModule({ shared }),
        AtlasGeneratedModule,
        AtlasModule
    );
    shared.ServiceRegistry.register(Atlas);
    registerValidationChecks(Atlas);
    if (!context.connection) {
        shared.workspace.ConfigurationProvider.initialized({});
    }
    return { shared, Atlas };
}
