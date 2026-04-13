import { defaultGlobalConfig, defaultUserConfig, type AllConfigKeys } from '../play';
import type { TranslationFunctions } from '../../i18n/i18n-types';
import type { tabFields, settingsSchema } from '.';
import {
  globalConfig,
  registerConfigHook,
  setConfigValue,
  setGlobalSetting,
  setUserSetting,
  toggleGlobal,
  toggleUser,
  userConfig
} from '../stores/config';
import { writable, type Readable } from 'svelte/store';

export interface UserConfigExtras {
  uiTheme?: string;
}

export function literal(text: string) {
  return () => text;
}

export const settingsTabs = [
  { id: 'general', label: literal('General') },
  { id: 'chat', label: (LL) => LL.ui.modal.settings.chatSettings() },
  { id: 'screenshots', label: (LL) => LL.ui.modal.settings.screenshotSettings() },
  { id: 'notifications', label: (LL) => LL.ui.modal.settings.notificationSettings() },
  { id: 'cache', label: (LL) => LL.ui.modal.settings.cacheSettings() },
  { id: 'account', label: (LL) => LL.ui.modal.settings.accountSettings() }
] as const satisfies { id: string; label: (LL: TranslationFunctions) => string }[];

export type SettingsTabId = (typeof settingsTabs)[number]['id'];
type ConfigScope = 'global' | 'user';
type ConfigPrimitive = string | number | boolean | null;
type ConfigKey<TScope extends ConfigScope> = string;

type I18nText = (LL: TranslationFunctions) => string;

type ToggleField<TScope extends ConfigScope, TKey extends ConfigKey<TScope>> = {
  kind: 'toggle';
  label: I18nText;
  tooltip?: I18nText;
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
  tooltip?: I18nText;
  tab: SettingsTabId;
  scope: TScope;
  key: TKey;
  size?: number;
  options: Array<{ label: I18nText; value: ConfigPrimitive }>;
};

type RangeField<TScope extends ConfigScope, TKey extends ConfigKey<TScope>> = {
  kind: 'range';
  label: I18nText;
  tooltip?: I18nText;
  tab: SettingsTabId;
  scope: TScope;
  key: TKey;
  min: number;
  max: number;
  step?: number;
};

type ToggleSeed<TScope extends ConfigScope> = Omit<ToggleField<TScope, ConfigKey<TScope>>, 'key'> & {
  key?: ConfigKey<TScope>;
};

type SelectSeed<TScope extends ConfigScope> = Omit<SelectField<TScope, ConfigKey<TScope>>, 'key'> & {
  key?: ConfigKey<TScope>;
};

type RangeSeed<TScope extends ConfigScope> = Omit<RangeField<TScope, ConfigKey<TScope>>, 'key'> & {
  key?: ConfigKey<TScope>;
};

type SettingDefinition = ToggleSeed<'global' | 'user'> | SelectSeed<'global' | 'user'> | RangeSeed<'global'>;

type ResolvedSettingDefinition =
  | ToggleField<'global' | 'user', ConfigKey<'global' | 'user'>>
  | SelectField<'global' | 'user', ConfigKey<'global' | 'user'>>
  | RangeField<'global', ConfigKey<'global'>>;

export type SettingField = ResolvedSettingDefinition & {
  // Derived from the dictionary path key(s), e.g. "history.mapChatHistoryLimit".
  name: string;
};

type ToggleOpts = {
  aria?: I18nText;
  tooltip?: I18nText;
  /**
   * If true, the UI toggled state is the inverse of the config value.
   */
  invert?: boolean;
  indent?: boolean;
};

type SelectOpts = { size?: number; tooltip?: I18nText };

type RangeOpts = { min: number; max: number; step?: number; tooltip?: I18nText };

type BoolConfigStore = Readable<boolean> & {
  set(value: boolean): void;
  toggle(): void;
};

type EncodableValue = null | boolean | number | string | EncodableValue[] | { [key: string]: EncodableValue };

type ValueConfigStore<T> = Readable<T> & {
  set(value: T): void;
  update(updater: (value: T) => T): void;
};

export function gbool<Key extends keyof typeof defaultGlobalConfig>(key: Key, ..._: any[]): BoolConfigStore {
  return {
    subscribe(run, invalidate) {
      return globalConfig.subscribe((config) => run(Boolean(config[key])), invalidate);
    },
    set(value: boolean) {
      setGlobalSetting(key as keyof GlobalConfig, value as GlobalConfig[keyof GlobalConfig]);
    },
    toggle() {
      toggleGlobal(key as keyof GlobalConfig & GlobalToggles);
    }
  };
}

export function ubool<Key extends keyof typeof defaultUserConfig>(key: Key): BoolConfigStore {
  return {
    subscribe(run, invalidate) {
      return userConfig.subscribe((config) => run(Boolean(config[key])), invalidate);
    },
    set(value: boolean) {
      setUserSetting(key as keyof UserConfig, value as UserConfig[keyof UserConfig]);
    },
    toggle() {
      toggleUser(key as keyof UserConfig & UserToggles);
    }
  };
}

function makeValueStore<T>(
  key: string,
  fallback: () => T,
  toStored: (value: T) => EncodableValue
): ValueConfigStore<T> {
  const store = writable<T>(fallback());

  registerConfigHook(key, (value) => {
    store.set(value === undefined ? fallback() : (value as T));
  });

  return {
    subscribe: store.subscribe,
    set(value: T) {
      setConfigValue(key, toStored(value));
      store.set(value);
    },
    update(updater: (value: T) => T) {
      store.update((current) => {
        const next = updater(current);
        setConfigValue(key, toStored(next));
        return next;
      });
    }
  };
}

export function gval<Key extends keyof typeof defaultGlobalConfig>(
  key: Key,
  ..._: any[]
): ValueConfigStore<(typeof defaultGlobalConfig)[Key]>;
export function gval<T extends EncodableValue = EncodableValue>(
  key: string,
  ..._: any[]
): ValueConfigStore<T | undefined>;
export function gval<T extends EncodableValue = EncodableValue>(key: string, ..._: any[]) {
  const hasDefault = key in defaultGlobalConfig;
  return makeValueStore<T | undefined>(
    key,
    () => (hasDefault ? ((defaultGlobalConfig as Record<string, unknown>)[key] as T) : undefined),
    (value) => value as EncodableValue
  );
}

export function uval<Key extends keyof typeof defaultUserConfig>(
  key: Key,
  ..._: any[]
): ValueConfigStore<(typeof defaultUserConfig)[Key]>;
export function uval<T extends EncodableValue = EncodableValue>(
  key: string,
  ..._: any[]
): ValueConfigStore<T | undefined>;
export function uval<T extends EncodableValue = EncodableValue>(key: string, ..._: any[]) {
  const hasDefault = key in defaultUserConfig;
  return makeValueStore<T | undefined>(
    key,
    () => (hasDefault ? ((defaultUserConfig as Record<string, unknown>)[key] as T) : undefined),
    (value) => value as EncodableValue
  );
}

export function makeTabBuilder(tab: SettingsTabId) {
  function gbool(label: I18nText, opts?: ToggleOpts): ToggleSeed<'global'> {
    return {
      kind: 'toggle',
      tab,
      scope: 'global',
      label,
      tooltip: opts?.tooltip,
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
      tooltip: opts?.tooltip,
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
      tooltip: opts?.tooltip,
      options,
      size: options.length > 4 ? undefined : options.length
    };
  }

  function grange(label: I18nText, opts: RangeOpts): RangeSeed<'global'> {
    return {
      kind: 'range',
      tab,
      scope: 'global',
      label,
      tooltip: opts.tooltip,
      min: opts.min,
      max: opts.max,
      step: opts.step
    };
  }

  return { gbool, ubool, gsel, grange };
}

export type TabBuilder = ReturnType<typeof makeTabBuilder>;
// NB: this pattern allows an object to have both a closed and open set of keys
// that can be used for type inference
export type TabConfig =
  | {
      [K in AllConfigKeys]?: SettingDefinition;
    }
  | Record<string, SettingsGroupNode<any>>;

export type SettingsNode<T extends Record<string, any>> = SettingDefinition | SettingsGroupNode<T>;
type SettingsGroupNode<Fields extends Record<string, any>> = {
  kind: 'group';
  fields: InferFields<Fields>;
};

type SettingsSchemaInput = Record<SettingsTabId, Record<string, SettingsNode<any>>>;

type InferNode<TName extends string, TNode> = TNode extends { kind: 'group'; fields: infer TFields }
  ? TFields extends Record<string, SettingsNode<infer Ignored>>
    ? { kind: 'group'; fields: InferFields<TFields> }
    : never
  : TNode extends ToggleSeed<infer TScope>
    ? Omit<TNode, 'key'> & { key: Extract<TName, ConfigKey<TScope>> }
    : TNode extends SelectSeed<infer TScope>
      ? Omit<TNode, 'key'> & { key: Extract<TName, ConfigKey<TScope>> }
      : TNode extends RangeSeed<infer TScope>
        ? Omit<TNode, 'key'> & { key: Extract<TName, ConfigKey<TScope>> }
        : TNode;

type InferFields<TFields extends Record<string, SettingsNode<any>>> = {
  [K in keyof TFields]: InferNode<K & string, TFields[K]>;
};

type InferSchema<TSchema extends SettingsSchemaInput> = {
  [K in SettingsTabId]: InferFields<TSchema[K]>;
};

export function defineSettingsSchema<TSchema extends SettingsSchemaInput>(schema: TSchema): InferSchema<TSchema> {
  return schema as unknown as InferSchema<TSchema>;
}

function inferFields<TFields extends Record<string, SettingsNode<any>>>(fields: TFields): InferFields<TFields> {
  return fields as InferFields<TFields>;
}

export function group<TFields extends Record<string, SettingsNode<any>>>(fields: TFields): SettingsGroupNode<TFields> {
  return { kind: 'group', fields: inferFields(fields) };
}

function flattenNode(path: string[], node: SettingsNode<any>): SettingField[] {
  if ('kind' in node && node.kind === 'group') {
    return Object.entries(node.fields).flatMap(([key, childNode]) => flattenNode([...path, key], childNode));
  }
  const key = (node.key ?? path[path.length - 1]) as ConfigKey<ConfigScope>;
  return [{ ...(node as ResolvedSettingDefinition), key: key as never, name: path.join('.') }];
}

export function flattenTab(tab: Record<string, SettingsNode<any>>): SettingField[] {
  return Object.entries(tab).flatMap(([key, node]) => flattenNode([key], node));
}

export type SettingsSchema = typeof settingsSchema;

type FieldValue<TField> = TField extends { kind: 'toggle' }
  ? boolean
  : TField extends { kind: 'range' }
    ? number
    : TField extends { options: Array<{ value: infer TValue }> }
      ? TValue
      : never;

// Recursively extract leaf seeds from raw tab fields using SettingsGroupNode's type
// parameter directly, avoiding deferred InferNode conditional types
type FlattenSeeds<T> = {
  [K in keyof T]: T[K] extends SettingsGroupNode<infer F> // If it's a group, recursively flatten its fields
    ? FlattenSeeds<F>
    : // If it's a toggle or select seed, convert it to a full field definition with the key
      Omit<T[K], 'key'> & { key: K & string };
}[keyof T];

type TabFieldsNodeUnion = {
  [Tab in SettingsTabId]: FlattenSeeds<ReturnType<(typeof tabFields)[Tab]>>;
}[SettingsTabId];

type ScopedSettingsField<TScope extends ConfigScope> = Extract<TabFieldsNodeUnion, { scope: TScope; key: string }>;

type InferConfigFromScopedFields<TScope extends ConfigScope> = {
  [TKey in ScopedSettingsField<TScope>['key']]: FieldValue<Extract<ScopedSettingsField<TScope>, { key: TKey }>>;
};

type TogglesOf<T> = keyof { [K in keyof T]: T[K] extends boolean ? true : never };
export type GlobalConfig = typeof defaultGlobalConfig & InferConfigFromScopedFields<'global'>;
export type GlobalToggles = TogglesOf<GlobalConfig>;
export type UserConfig = typeof defaultUserConfig & InferConfigFromScopedFields<'user'> & UserConfigExtras;
export type UserToggles = TogglesOf<UserConfig>;

export const cacheActions = [
  {
    type: 'location' as const,
    label: (LL) => LL.ui.modal.cacheSettings.fields.locationCache(),
    actionLabel: (LL) => LL.ui.modal.cacheSettings.clear()
  },
  {
    type: 'map' as const,
    label: (LL) => LL.ui.modal.cacheSettings.fields.mapCache(),
    actionLabel: (LL) => LL.ui.modal.cacheSettings.clear()
  },
  {
    type: 'locationColor' as const,
    label: (LL) => LL.ui.modal.cacheSettings.fields.locationColorCache(),
    actionLabel: (LL) => LL.ui.modal.cacheSettings.clear()
  }
] satisfies {
  label: (LL: TranslationFunctions) => string;
  type: 'location' | 'map' | 'locationColor';
  actionLabel: (LL: TranslationFunctions) => string;
}[];
