import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const releaseDir = path.resolve(rootDir, "release");
const distDir = path.resolve(rootDir, "dist");
const releaseDistDir = path.resolve(releaseDir, "dist");
const csprojPath = path.resolve(rootDir, "src-desktop", "FretTabRunnerDesktop.csproj");

console.log("\n🎸 [FretTabRunner] Compiling Desktop Executable...");

// 1. Publish .NET Desktop WebView2 Executable into release/
try {
  execSync(
    `dotnet publish "${csprojPath}" -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o "${releaseDir}"`,
    { stdio: "inherit", cwd: rootDir }
  );
} catch (err) {
  console.error("❌ Failed to compile desktop executable:", err.message);
  process.exit(1);
}

// 2. Synchronize dist directory to release/dist
if (fs.existsSync(distDir)) {
  console.log("📦 Syncing frontend web assets to release/dist...");
  if (fs.existsSync(releaseDistDir)) {
    fs.rmSync(releaseDistDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, releaseDistDir, { recursive: true });
}

// 3. Copy executable to project root as FretTabRunner.exe and FretRunner.exe for easy access
const releaseExe = path.resolve(releaseDir, "FretTabRunner.exe");
const rootExe = path.resolve(rootDir, "FretTabRunner.exe");
const aliasExe = path.resolve(rootDir, "FretRunner.exe");

if (fs.existsSync(releaseExe)) {
  fs.copyFileSync(releaseExe, rootExe);
  fs.copyFileSync(releaseExe, aliasExe);
  console.log("📂 Mirrored executable to workspace root for quick access:");
  console.log(`   ${rootExe}`);
  console.log(`   ${aliasExe}`);
}

// 4. Ensure desktop shortcut exists and points to release/FretTabRunner.exe
console.log("🔗 Verifying Desktop shortcut...");
const psScript = `
$WshShell = New-Object -ComObject WScript.Shell
$targetExe = "${releaseExe.replace(/\\/g, "\\\\")}"
$workingDir = "${releaseDir.replace(/\\/g, "\\\\")}"
$iconLoc = "${path.resolve(releaseDir, "icon.ico").replace(/\\/g, "\\\\")}"

$desktopPaths = @(
    [Environment]::GetFolderPath("Desktop"),
    "$env:USERPROFILE\\Desktop"
) | Select-Object -Unique

foreach ($dp in $desktopPaths) {
    if (Test-Path $dp) {
        $shortcutPath = Join-Path $dp "FretTabRunner.lnk"
        $shortcut = $WshShell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = $targetExe
        $shortcut.WorkingDirectory = $workingDir
        $shortcut.IconLocation = "$iconLoc,0"
        $shortcut.Description = "FretTabRunner - Interactive Tablature & Fretboard Runner Engine"
        $shortcut.Save()
        Write-Output "   -> Desktop shortcut ready at: $shortcutPath"

        # Also create a FretRunner.lnk alias shortcut for convenience
        $aliasShortcutPath = Join-Path $dp "FretRunner.lnk"
        $aliasShortcut = $WshShell.CreateShortcut($aliasShortcutPath)
        $aliasShortcut.TargetPath = $targetExe
        $aliasShortcut.WorkingDirectory = $workingDir
        $aliasShortcut.IconLocation = "$iconLoc,0"
        $aliasShortcut.Description = "FretRunner - Interactive Tablature & Fretboard Runner Engine"
        $aliasShortcut.Save()
        Write-Output "   -> Desktop shortcut ready at: $aliasShortcutPath"
    }
}
`;

try {
  execSync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`, {
    stdio: "inherit",
  });
} catch (e) {
  console.warn("⚠️ Could not update desktop shortcut:", e.message);
}

console.log("\n✅ [FretTabRunner] Build complete! Executable is ready at:");
console.log(`   1) Desktop Shortcuts: 'FretTabRunner' and 'FretRunner'`);
console.log(`   2) Workspace Root:    ${rootExe}`);
console.log(`   3) Release Folder:    ${releaseExe}\n`);
