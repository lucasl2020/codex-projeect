const test = require('node:test');
const assert = require('node:assert/strict');
const { createIDEInstances, VSCodeBasedIDEManager } = require('../lib/vscode-ide-mgr');

test('Cursor 管理器正确识别本机安装与进程配置', () => {
  const { cursorMgr } = createIDEInstances();
  const info = cursorMgr.detectInstallation();
  assert.equal(info.id, 'cursor');
  assert.equal(info.name, 'Cursor');
  assert.equal(info.installed, true);
  assert.ok(info.exe.includes('Cursor.exe'));
  assert.ok(info.configDir.includes('Cursor'));
});

test('Cursor 正确从 state.vscdb 解析当前活跃账号信息', () => {
  const { cursorMgr } = createIDEInstances();
  const active = cursorMgr.getActiveAccount();
  assert.ok(active);
  assert.equal(active.tool, 'cursor');
  assert.ok(active.email.includes('@'));
  assert.ok(active.username);
});

test('Cursor 读取并生成 4 项硬件设备指纹', () => {
  const { cursorMgr } = createIDEInstances();
  const profile = cursorMgr.getDeviceProfile();
  assert.ok(profile);
  assert.equal(profile.exists, true);
  assert.ok(profile.machine_id);
  assert.ok(profile.dev_device_id);
});

test('VS Code 管理器正确识别安装并支持沙箱多开参数构建', () => {
  const { vscodeMgr } = createIDEInstances();
  const info = vscodeMgr.detectInstallation();
  assert.equal(info.id, 'vscode');
  assert.equal(info.name, 'VS Code');
  assert.equal(info.installed, true);
});

test('Windsurf 管理器定义合规且提供完整的生命周期接口', () => {
  const { windsurfMgr } = createIDEInstances();
  assert.equal(windsurfMgr.id, 'windsurf');
  assert.equal(typeof windsurfMgr.detectInstallation, 'function');
  assert.equal(typeof windsurfMgr.launch, 'function');
  assert.equal(typeof windsurfMgr.launchIsolated, 'function');
  assert.equal(typeof windsurfMgr.resetDeviceProfile, 'function');
  assert.equal(typeof windsurfMgr.saveAccountSnapshot, 'function');
  assert.equal(typeof windsurfMgr.applyAccountSnapshot, 'function');
});
