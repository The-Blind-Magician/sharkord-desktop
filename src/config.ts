import { app } from 'electron';
import fs from 'fs';
import path from 'path';

type AppConfig = {
  configPath: string;
  sharkordUrl: string;
};

const CONFIG_FILE_NAMES = ['config.ini', '.env'];
const URL_KEYS = new Set([
  'SHARKORD_URL',
  'URL',
  'url',
  'destination_url',
  'DESTINATION_URL',
  'destinationUrl',
]);

const getPreferredConfigPath = () =>
  path.join(app.getPath('userData'), 'config.ini');

const getLegacyConfigPaths = () =>
  CONFIG_FILE_NAMES.flatMap((fileName) => [
    path.join(process.cwd(), fileName),
    path.join(app.getAppPath(), fileName),
    path.join(path.dirname(process.execPath), fileName),
  ]);

const getConfigPaths = () => {
  const paths: string[] = [];
  const overridePath = process.env.SHARKORD_CONFIG_FILE?.trim();

  if (overridePath) {
    paths.push(path.resolve(overridePath));
  }

  paths.push(getPreferredConfigPath());

  for (const fileName of CONFIG_FILE_NAMES) {
    paths.push(path.join(app.getPath('userData'), fileName));
    paths.push(path.join(process.cwd(), fileName));
    paths.push(path.join(app.getAppPath(), fileName));
    paths.push(path.join(path.dirname(process.execPath), fileName));
  }

  return Array.from(new Set(paths));
};

const stripQuotes = (value: string) => {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const readUrlFromConfig = (contents: string) => {
  const trimmed = contents.trim();

  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes('\n')) {
    return trimmed;
  }

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#') || line.startsWith(';')) {
      continue;
    }

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/.exec(
      line
    );

    if (match && URL_KEYS.has(match[1])) {
      return stripQuotes(match[2]);
    }
  }

  return null;
};

const validateUrl = (value: string, configPath: string) => {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid Sharkord URL in ${configPath}: ${value}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(
      `Invalid Sharkord URL protocol in ${configPath}: ${parsed.protocol}`
    );
  }

  return parsed.toString();
};

const migrateLegacyConfigIfNeeded = () => {
  const preferredConfigPath = getPreferredConfigPath();

  if (fs.existsSync(preferredConfigPath)) {
    return;
  }

  for (const legacyPath of Array.from(new Set(getLegacyConfigPaths()))) {
    if (!fs.existsSync(legacyPath)) {
      continue;
    }

    const contents = fs.readFileSync(legacyPath, 'utf8');
    const url = readUrlFromConfig(contents);

    if (!url) {
      continue;
    }

    validateUrl(url, legacyPath);
    fs.mkdirSync(path.dirname(preferredConfigPath), { recursive: true });
    fs.writeFileSync(preferredConfigPath, contents, 'utf8');
    return;
  }
};

const loadAppConfig = (): AppConfig => {
  migrateLegacyConfigIfNeeded();

  const searchedPaths = getConfigPaths();

  for (const configPath of searchedPaths) {
    if (!fs.existsSync(configPath)) {
      continue;
    }

    const contents = fs.readFileSync(configPath, 'utf8');
    const url = readUrlFromConfig(contents);

    if (url) {
      return {
        configPath,
        sharkordUrl: validateUrl(url, configPath),
      };
    }
  }

  throw new Error(
    [
      'Unable to find a Sharkord destination URL.',
      'Create config.ini with SHARKORD_URL=https://your-sharkord-server.example',
      `Searched: ${searchedPaths.join(', ')}`,
    ].join('\n')
  );
};

export { loadAppConfig };
