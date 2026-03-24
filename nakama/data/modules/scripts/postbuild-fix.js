const fs = require("fs");
const path = require("path");

const buildFile = path.join(__dirname, "..", "build", "index.js");
let content = fs.readFileSync(buildFile, "utf8");

const shorthandBlock =
  /initializer\.registerMatch\("tictactoe",\s*\{\s*matchInit,\s*matchJoinAttempt,\s*matchJoin,\s*matchLeave,\s*matchLoop,\s*matchTerminate,\s*matchSignal\s*\}\);/m;
const keyedBlockAlreadyPresent =
  /initializer\.registerMatch\("tictactoe",\s*\{\s*matchInit:\s*[^,]+,\s*matchJoinAttempt:\s*[^,]+,\s*matchJoin:\s*[^,]+,\s*matchLeave:\s*[^,]+,\s*matchLoop:\s*[^,]+,\s*matchTerminate:\s*[^,]+,\s*matchSignal:\s*[^,]+\s*\}\);/m;

const keyedBlock = `initializer.registerMatch("tictactoe", {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal
  });`;

if (keyedBlockAlreadyPresent.test(content)) {
  console.log(
    "postbuild-fix: registerMatch block already keyed, no changes needed",
  );
  process.exit(0);
}

if (!shorthandBlock.test(content)) {
  console.error("postbuild-fix: expected registerMatch block not found");
  process.exit(1);
}

content = content.replace(shorthandBlock, keyedBlock);
fs.writeFileSync(buildFile, content, "utf8");
console.log("postbuild-fix: registerMatch block rewritten to keyed properties");
