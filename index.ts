import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as cache from '@actions/cache'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import fetch from 'node-fetch'
import crypto from 'crypto'

async function latestGhjkVersion() {
  const resp = await fetch(
    `https://api.github.com/repos/metatypedev/ghjk/releases/latest`
  )
  if (!resp.ok) {
    throw new Error(
      `error fetching latest ghjk release meta: ${resp.statusText}`
    )
  }
  const meta = (await resp.json()) as {
    tag_name: string
  }
  return meta.tag_name
}
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function main(): Promise<void> {
  try {
    const inputVersion = core.getInput('version')
    const inputInstallerUrl = core.getInput('installer-url')
    const inputCook = core.getInput('cook')
    const inputCacheDisable = core.getInput('cache-disable')
    const inputCacheKeyPrefix = core.getInput('cache-key-prefix')
    const inputCacheSaveIf = core.getInput('cache-save-if')
    const inputCacheKeyEnvVars = core.getInput('cache-key-env-vars')

    process.env.GHJK_LOG = 'debug'
    const denoCache = path.resolve(os.homedir(), '.cache', 'deno')
    process.env.DENO_DIR = denoCache
    process.env.GHJK_INSTALL_DENO_DIR = denoCache

    const version =
      inputVersion.length > 0
        ? inputVersion
        : (process.env['GHJK_VERSION'] ?? (await latestGhjkVersion()))

    const installerUrl =
      inputInstallerUrl.length > 0
        ? inputInstallerUrl
        : `https://raw.github.com/metatypedev/ghjk/${version}/install.ts`

    const execDir = await installGhjk(version, installerUrl)

    core.addPath(execDir)

    const configStr = (await exec.getExecOutput('ghjk', ['print', 'config']))
      .stdout

    const dataDir = (
      await exec.getExecOutput('ghjk', ['print', 'data-dir-path'], {
        silent: true
      })
    ).stdout.trim()

    if (inputCacheDisable === 'false' && cache.isFeatureAvailable()) {
      const ghjkVersion = (
        await exec.getExecOutput('ghjk', ['--version'], { silent: true })
      ).stdout.trim()

      const configPath = (
        await exec.getExecOutput('ghjk', ['print', 'ghjkfile-path'], {
          silent: true
        })
      ).stdout.trim()
      const ghjkDirPath = (
        await exec.getExecOutput('ghjk', ['print', 'ghjkdir-path'], {
          silent: true
        })
      ).stdout.trim()

      const lockfilePath = path.resolve(ghjkDirPath, 'lock.json')
      let lockJson = undefined
      try {
        lockJson = await fs.readFile(lockfilePath, { encoding: 'utf8' })
      } catch (_err) {
        /* FILE was not found*/
      }

      const hasher = crypto.createHash('sha1')

      hasher.update(ghjkVersion)
      hasher.update(configPath)
      // TODO: consider ignoring config to avoid misses just for one dep change
      hasher.update(configStr)
      if (lockJson) {
        hasher.update(lockJson)
      }

      const hashedEnvs = [
        'GHJK',
        'DENO',
        ...inputCacheKeyEnvVars
          .split(',')
          .filter(str => str.length > 0)
          .map(str => str.trim())
      ]
      for (const [key, val] of Object.entries(process.env)) {
        if (hashedEnvs.some(pfix => key.startsWith(pfix))) {
          hasher.update(`${key}=${val}`)
        }
      }
      const hash = hasher.digest('hex')
      const keyPrefix =
        inputCacheKeyPrefix.length > 0 ? inputCacheKeyPrefix : 'v0-ghjk'
      const key = `${keyPrefix}-${hash}`

      const portsDir = core.toPlatformPath(path.resolve(dataDir, 'ports'))
      const cacheDirs = [portsDir, denoCache]
      core.info(JSON.stringify({ cacheDirs, portsDir }))
      // NOTE: restoreCache modifies the array it's given for some reason
      await cache.restoreCache([...cacheDirs], key)
      if (inputCacheSaveIf === 'true') {
        core.info(`enabling cache with key ${key}: [${cacheDirs}]`)
        core.saveState('ghjk-cache-save', true)
        core.saveState('ghjk-post-args', {
          key,
          cacheDirs
        })
      }
    }

    if (inputCook === 'true') {
      await exec.exec('ghjk', ['envs', 'cook'])
    }

    core.exportVariable('BASH_ENV', `${dataDir}/env.bash`)
    core.exportVariable('GHJK_SHARE_DIR', dataDir)
    core.exportVariable('GHJK_DENO_DIR', denoCache)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

export async function installGhjk(version: string, installerUrl: string) {
  function archiveName() {
    let arch
    switch (process.arch) {
      case 'arm64':
        arch = 'aarch64'
        break
      case 'x64':
        arch = 'x86_64'
        break
      default:
        throw new Error(`Unsupported architechture ${process.arch}.`)
    }

    let platform
    switch (process.platform) {
      case 'linux':
        platform = 'unknown-linux-gnu'
        break
      case 'darwin':
        platform = 'apple-darwin'
        break
      // case 'win32':
      //   platform = 'pc-windows-msvc'
      //   break
      default:
        throw new Error(`Unsupported platform ${process.platform}.`)
    }

    return `ghjk-${version}-${arch}-${platform}.tar.gz`
  }
  let execFile
  let execDir = tc.find('ghjk', version)
  const installDir =
    process.env['GHJK_INSTALL_EXE_DIR'] ??
    core.toPlatformPath(path.resolve(os.homedir(), '.local', 'bin'))

  if (execDir.length !== 0) {
    core.debug(`found cached ghjk tool under version ${version}: ${execDir}`)
    execFile = `${execDir}/ghjk`
  } else {
    core.debug(`unable to find cached ghjk tool under version ${version}`)
    const fileName = archiveName()
    const url = `https://github.com/denoland/deno/releases/download/v${version}/${fileName}`

    core.info(`Downloading ghjk from ${url}.`)
    const archive = await tc.downloadTool(url)

    const extractedFolder = await tc.extractTar(archive)

    execDir = await tc.cacheDir(extractedFolder, 'ghjk', version)
    core.info(`Cached ghjk to ${execDir}.`)

    execFile = `${execDir}/ghjk`
  }

  core.debug(`installing ghjk using install.ts`)
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    GHJK_INSTALL_EXE_DIR: installDir,
    SHELL: 'bash'
  }
  core.debug(JSON.stringify({ execFile, env }, undefined, '  '))
  await exec.exec(`"${execFile}" deno run -A`, [installerUrl], { env })
  return execDir
}

/**
 * The post function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function post(): Promise<void> {
  try {
    if (
      cache.isFeatureAvailable() &&
      core.getState('ghjk-cache-save') === 'true'
    ) {
      const argsStr = core.getState('ghjk-post-args')
      core.info(argsStr)
      const args = JSON.parse(argsStr)
      const { key, cacheDirs } = args
      await cache.saveCache(cacheDirs, key)
    } else {
      core.info('cache-save flag is false, skipping')
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
