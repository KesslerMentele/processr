grammar Atlas

entry Gamepack:
    'gamepack' id=PACK_ID '{'
        (
            'name'        name+=STRING        |
            'game'        gameName+=STRING    |
            'version'     version+=STRING     |
            'gameVersion' gameVersion+=STRING |
            'description' description+=STRING |
            'author'      author+=STRING      |
            'url'         url+=STRING
        )*
    '}'
    (categories+=Category | items+=Item | nodeTemplates+=NodeTemplate | recipes+=Recipe)*;

Category:
    'category' id=PACK_ID ('{'
        (
            'name'        name+=STRING                  |
            'description' description+=STRING           |
            'icon'        icon+=STRING                  |
            'color'       color+=STRING                 |
            'sortOrder'   sortOrder+=INT                |
            'parent'      parent+=[Category:PACK_ID]
        )*
    '}')?
;

Item:
    'item' id=PACK_ID ('{'
        (
            'name'        name+=STRING                  |
            'description' description+=STRING           |
            'icon'        icon+=STRING                  |
            'color'       color+=STRING                 |
            'category'    category+=[Category:PACK_ID]  |
            'form'        form+=ItemForm
        )*
    '}')?
;

ItemForm returns string:
    'solid' | 'fluid' | 'gas' | 'energy'
;

NodeTemplate:
    'node' id=PACK_ID '{'
        (
            'name'        name+=STRING                  |
            'description' description+=STRING           |
            'icon'        icon+=STRING                  |
            'color'       color+=STRING                 |
            'category'    category+=[Category:PACK_ID]  |
            'speed'       speed+=Num                    |
            'power'       power+=Num                    |
            'moduleSlots' moduleSlots+=INT              |
            'tags'        '[' tags+=STRING (',' tags+=STRING)* ']' |
            ports+=PortDef
        )*
    '}'
;

PortDef:
    'port' direction=PortDirection id=PACK_ID ('{'
        ('label' label=STRING)?
    '}')?
;

PortDirection returns string:
    'input' | 'output'
;

Recipe:
    'recipe' id=PACK_ID '{'
        (
            'name'        name+=STRING                  |
            'description' description+=STRING           |
            'icon'        icon+=STRING                  |
            'color'       color+=STRING                 |
            'category'    category+=[Category:PACK_ID]  |
            'duration'    duration+=Num unit+=DurationUnit |
            'in'          inputs+=IngredientSpec        |
            'out'         outputs+=ProductSpec          |
            'nodes'       '[' compatibleNodes+=[NodeTemplate:PACK_ID] (',' compatibleNodes+=[NodeTemplate:PACK_ID])* ']' |
            'tags'        '[' compatibleTags+=STRING (',' compatibleTags+=STRING)* ']'
        )*
    '}'
;

IngredientSpec:
    amount=Num item=[Item:PACK_ID]
;

ProductSpec:
    amount=Num item=[Item:PACK_ID]
;

DurationUnit returns string:
    'sec' | 'min' | 'hr'
;

Num returns number:
    INT | FLOAT
;

terminal FLOAT returns number: /[0-9]+\.[0-9]+/;
hidden terminal WS: /\s+/;
terminal PACK_ID: /[a-zA-Z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
