import type { TranslationFunctions } from '../i18n/i18n-types';

const literal = (text: string): I18nText => () => text;

interface UserConfigExtras {
  uiTheme?: string;
}

export const settingsTabs = [
  { id: 'general', label: literal('General') },
  { id: 'chat', label: LL => LL.ui.modal.settings.chatSettings() },
  { id: 'screenshots', label: LL => LL.ui.modal.settings.screenshotSettings() },
  { id: 'notifications', label: LL => LL.ui.modal.settings.notificationSettings() },
  { id: 'cache', label: LL => LL.ui.modal.settings.cacheSettings() },
  { id: 'account', label: LL => LL.ui.modal.settings.accountSettings() }
] as const satisfies { id: string, label: (LL: TranslationFunctions) => string }[]

const tabFields = {
  general(tab) {
    return {
      immersionMode: tab.ubool(LL => LL.ui.modal.settings.fields.toggleImmersionMode.label()),
      singleplayerMode: tab.ubool(LL => LL.ui.modal.settings.fields.toggleSingleplayerMode.label()),
      highContrast: tab.gbool(literal('High Contrast Mode (WCAG AA)')),
      locationDisplay: tab.gbool(LL => LL.ui.modal.settings.fields.toggleLocationDisplay()),
      hideRankings: tab.gbool(LL => LL.ui.modal.settings.fields.toggleRankings(), { invert: true }),
      hideSchedules: tab.gbool(LL => LL.ui.modal.settings.fields.toggleSchedules(), { invert: true }),
      preloads: tab.gbool(LL => LL.ui.modal.settings.fields.togglePreloads.label()),
      unicodeFont: tab.gbool(LL => LL.ui.modal.settings.fields.unicodeFont())
    }
  },

  chat(tab) {
    return {
      overlay: group({
        gameChat: tab.gbool(LL => LL.ui.modal.chatSettings.fields.toggleGameChat.label()),
        gameChatGlobal: tab.gbool(LL => LL.ui.modal.chatSettings.fields.toggleGameChat.global(), {
          indent: true
        }),
        gameChatParty: tab.gbool(LL => LL.ui.modal.chatSettings.fields.toggleGameChat.party(), {
          indent: true
        })
      }),
      tabToChat: tab.gbool(LL => LL.ui.modal.chatSettings.fields.toggleTabToChat()),
      playMentionSound: tab.gbool(LL => LL.ui.modal.chatSettings.fields.togglePlayMentionSound()),
      blurScreenshotEmbeds: tab.gbool(LL => LL.ui.modal.chatSettings.fields.blurScreenshotEmbeds()),
      history: group({
        mapChatHistoryLimit: tab.gsel(LL => LL.ui.modal.chatSettings.fields.mapChatHistoryLimit.label(), chatHistoryOptions),
        globalChatHistoryLimit: tab.gsel(LL => LL.ui.modal.chatSettings.fields.globalChatHistoryLimit.label(), chatHistoryOptions),
        partyChatHistoryLimit: tab.gsel(LL => LL.ui.modal.chatSettings.fields.partyChatHistoryLimit.label(), chatHistoryOptions)
      })
    };
  },

  screenshots(tab) {
    return {
      autoDownloadScreenshots: tab.gbool(LL => LL.ui.modal.screenshotSettings.fields.autoDownloadScreenshots()),
      screenshotResolution: tab.gsel(LL => LL.ui.modal.screenshotSettings.fields.screenshotResolution.label(), [
        { label: LL => LL.ui.modal.screenshotSettings.fields.screenshotResolution.values['1'](), value: 1 },
        { label: LL => LL.ui.modal.screenshotSettings.fields.screenshotResolution.values['2'](), value: 2 },
        { label: LL => LL.ui.modal.screenshotSettings.fields.screenshotResolution.values['3'](), value: 3 },
        { label: LL => LL.ui.modal.screenshotSettings.fields.screenshotResolution.values['4'](), value: 4 }
      ])
    };
  },

  notifications(tab) {
    return {
      notifications: tab.gbool(LL => LL.ui.modal.notificationSettings.fields.toggleNotifications()),
      notificationScreenPosition: tab.gsel(
        LL => LL.ui.modal.notificationSettings.fields.screenPosition.label(),
        [
          { label: LL => LL.ui.modal.notificationSettings.fields.screenPosition.values.bottomLeft(), value: 'bottomLeft' },
          { label: LL => LL.ui.modal.notificationSettings.fields.screenPosition.values.bottomRight(), value: 'bottomRight' },
          { label: LL => LL.ui.modal.notificationSettings.fields.screenPosition.values.topLeft(), value: 'topLeft' },
          { label: LL => LL.ui.modal.notificationSettings.fields.screenPosition.values.topRight(), value: 'topRight' }
        ],
        { size: 4 }
      )
    };
  },

  cache() {
    return {};
  },

  account() {
    return {};
  }
} satisfies Record<string, (tab: TabBuilder) => Record<string, SettingsNode<any>>>;

// --- configuration end ---

export type SettingsTabId = typeof settingsTabs[number]['id'];
type ConfigScope = 'global' | 'user';
type ConfigPrimitive = string | number | boolean | null;
type ConfigKey<TScope extends ConfigScope> = string;

type I18nText = (LL: TranslationFunctions) => string;

type ToggleField<TScope extends ConfigScope, TKey extends ConfigKey<TScope>> = {
  kind: 'toggle';
  label: I18nText;
  ariaLabel?: I18nText;
  tab: SettingsTabId;
  scope: TScope;
  key: TKey;
  /** If true, the UI toggled state is the inverse of the config value.
   * Example: a "Hide X" config is true when hidden, but the toggle should appear active when visible.
   */
  invert?: boolean;
  indent?: boolean;
};

type SelectField<TScope extends ConfigScope, TKey extends ConfigKey<TScope>> = {
  kind: 'select';
  label: I18nText;
  tab: SettingsTabId;
  scope: TScope;
  key: TKey;
  size?: number;
  options: Array<{ label: I18nText; value: ConfigPrimitive }>;
};

type ToggleSeed<TScope extends ConfigScope> = Omit<ToggleField<TScope, ConfigKey<TScope>>, 'key'> & {
  key?: ConfigKey<TScope>;
};

type SelectSeed<TScope extends ConfigScope> = Omit<SelectField<TScope, ConfigKey<TScope>>, 'key'> & {
  key?: ConfigKey<TScope>;
};

type SettingDefinition =
  | ToggleSeed<'global' | 'user'>
  | SelectSeed<'global' | 'user'>

type ResolvedSettingDefinition =
  ToggleField<'global' | 'user', ConfigKey<'global' | 'user'>>
  | SelectField<'global' | 'user', ConfigKey<'global' | 'user'>>;

export type SettingField = ResolvedSettingDefinition & {
  // Derived from the dictionary path key(s), e.g. "history.mapChatHistoryLimit".
  name: string;
};

type ToggleOpts = {
  aria?: I18nText;
  /**
   * If true, the UI toggled state is the inverse of the config value.
   */
  invert?: boolean;
  indent?: boolean;
};

type SelectOpts = { size?: number };

const CHAT_HISTORY_KEYS = ['0', '25', '50', '100', '250', '500', '1000', '2500'] as const;
const CHAT_HISTORY_VALUES = [25, 50, 100, 250, 500, 1000, 2500, 0] as const;

const chatHistoryOptions = CHAT_HISTORY_VALUES.map((value) => ({
  label: (LL: TranslationFunctions) =>
    LL.ui.modal.chatSettings.fields.chatHistoryLimit.values[String(value) as (typeof CHAT_HISTORY_KEYS)[number]](),
  value
}));

function makeTabBuilder(tab: SettingsTabId) {
  function gbool(label: I18nText, opts?: ToggleOpts): ToggleSeed<'global'> {
    return {
      kind: 'toggle',
      tab,
      scope: 'global',
      label,
      ariaLabel: opts?.aria ?? label,
      invert: opts?.invert,
      indent: opts?.indent
    };
  }

  function ubool(label: I18nText, opts?: ToggleOpts): ToggleSeed<'user'> {
    return {
      kind: 'toggle',
      tab,
      scope: 'user',
      label,
      ariaLabel: opts?.aria ?? label,
      invert: opts?.invert,
      indent: opts?.indent
    };
  }

  function gsel(
    label: I18nText,
    options: Array<{ label: I18nText; value: ConfigPrimitive }>,
    opts?: SelectOpts
  ): SelectSeed<'global'> {
    return {
      kind: 'select',
      tab,
      scope: 'global',
      label,
      options,
      size: opts?.size
    };
  }

  return { gbool, ubool, gsel };
}

type TabBuilder = ReturnType<typeof makeTabBuilder>;

type SettingsNode<T extends Record<string, any>> = SettingDefinition | SettingsGroupNode<T>;
type SettingsGroupNode<Fields extends Record<string, any>> = {
  kind: 'group';
  fields: InferFields<Fields>;
};

type SettingsSchemaInput = Record<SettingsTabId, Record<string, SettingsNode<any>>>;

type InferNode<TName extends string, TNode> =
  TNode extends { kind: 'group'; fields: infer TFields }
  ? TFields extends Record<string, SettingsNode<infer Ignored>>
  ? { kind: 'group'; fields: InferFields<TFields> }
  : never
  : TNode extends ToggleSeed<infer TScope>
  ? Omit<TNode, 'key'> & { key: Extract<TName, ConfigKey<TScope>> }
  : TNode extends SelectSeed<infer TScope>
  ? Omit<TNode, 'key'> & { key: Extract<TName, ConfigKey<TScope>> }
  : TNode;

type InferFields<TFields extends Record<string, SettingsNode<any>>> = {
  [K in keyof TFields]: InferNode<K & string, TFields[K]>;
};

type InferSchema<TSchema extends SettingsSchemaInput> = {
  [K in SettingsTabId]: InferFields<TSchema[K]>;
};

function defineSettingsSchema<TSchema extends SettingsSchemaInput>(schema: TSchema): InferSchema<TSchema> {
  return schema as unknown as InferSchema<TSchema>;
}

function inferFields<TFields extends Record<string, SettingsNode<any>>>(fields: TFields): InferFields<TFields> {
  return fields as InferFields<TFields>;
}

function group<TFields extends Record<string, SettingsNode<any>>>(fields: TFields): SettingsGroupNode<TFields> {
  return { kind: 'group', fields: inferFields(fields) };
}

function flattenNode(path: string[], node: SettingsNode<any>): SettingField[] {
  if ('kind' in node && node.kind === 'group') {
    return Object.entries(node.fields).flatMap(([key, childNode]) => flattenNode([...path, key], childNode));
  }
  const key = (node.kind === 'toggle' && !node.key ? path[path.length - 1] : node.key) as ConfigKey<ConfigScope>;
  return [{ ...(node as ResolvedSettingDefinition), key: key as never, name: path.join('.') }];
}

function flattenTab(tab: Record<string, SettingsNode<any>>): SettingField[] {
  return Object.entries(tab).flatMap(([key, node]) => flattenNode([key], node));
}

const settingsSchema = defineSettingsSchema({
  general: tabFields.general(makeTabBuilder('general')),
  chat: tabFields.chat(makeTabBuilder('chat')),
  screenshots: tabFields.screenshots(makeTabBuilder('screenshots')),
  notifications: tabFields.notifications(makeTabBuilder('notifications')),
  cache: tabFields.cache(),
  account: tabFields.account()
});

export type SettingsSchema = typeof settingsSchema;

type FieldValue<TField> = TField extends { kind: 'toggle' }
  ? boolean
  : TField extends { options: Array<{ value: infer TValue }> }
  ? TValue
  : never;

// Recursively extract leaf seeds from raw tab fields using SettingsGroupNode's type
// parameter directly, avoiding deferred InferNode conditional types
type FlattenSeeds<T> = {
  [K in keyof T]:
  // If it's a group, recursively flatten its fields
  T[K] extends SettingsGroupNode<infer F>
  ? FlattenSeeds<F>
  // If it's a toggle or select seed, convert it to a full field definition with the key
  : Omit<T[K], 'key'> & { key: K & string }
}[keyof T];

type TabFieldsNodeUnion = {
  [Tab in SettingsTabId]: FlattenSeeds<ReturnType<(typeof tabFields)[Tab]>>
}[SettingsTabId];

type ScopedSettingsField<TScope extends ConfigScope> = Extract<TabFieldsNodeUnion, { scope: TScope; key: string }>;

type InferConfigFromScopedFields<TScope extends ConfigScope> = {
  [TKey in ScopedSettingsField<TScope>['key']]: FieldValue<Extract<ScopedSettingsField<TScope>, { key: TKey }>>;
};

export type GlobalConfig = InferConfigFromScopedFields<'global'>;
export type UserConfig = InferConfigFromScopedFields<'user'> & UserConfigExtras;

export const settingsFieldsByTab = {
  general: flattenTab(settingsSchema.general),
  chat: flattenTab(settingsSchema.chat),
  screenshots: flattenTab(settingsSchema.screenshots),
  notifications: flattenTab(settingsSchema.notifications),
  cache: flattenTab(settingsSchema.cache),
  account: flattenTab(settingsSchema.account)
};

export const cacheActions = [
  {
    type: 'location' as const,
    label: LL => LL.ui.modal.cacheSettings.fields.locationCache(),
    actionLabel: LL => LL.ui.modal.cacheSettings.clear()
  },
  {
    type: 'map' as const,
    label: LL => LL.ui.modal.cacheSettings.fields.mapCache(),
    actionLabel: LL => LL.ui.modal.cacheSettings.clear()
  },
  {
    type: 'locationColor' as const,
    label: LL => LL.ui.modal.cacheSettings.fields.locationColorCache(),
    actionLabel: LL => LL.ui.modal.cacheSettings.clear()
  }
] satisfies {
  label: (LL: TranslationFunctions) => string;
  type: 'location' | 'map' | 'locationColor';
  actionLabel: (LL: TranslationFunctions) => string;
}[]
