// Internal one-off: add bgVariant?: BackgroundVariant prop to each v2 component
import { readFileSync, writeFileSync } from "node:fs";

// Map: file -> { interfaceName, fnName }
const targets = [
  { file: "src/remotion/components/CompareSplit.tsx", interfaceName: "CompareSplitProps", fnName: "CompareSplit" },
  { file: "src/remotion/components/StackedBarCompare.tsx", interfaceName: "StackedBarCompareProps", fnName: "StackedBarCompare" },
  { file: "src/remotion/components/TaxSavingsDemo.tsx", interfaceName: "TaxSavingsDemoProps", fnName: "TaxSavingsDemo" },
  { file: "src/remotion/components/InfinityFact.tsx", interfaceName: "InfinityFactProps", fnName: "InfinityFact" },
  { file: "src/remotion/components/PhoneStepsDemo.tsx", interfaceName: "PhoneStepsDemoProps", fnName: "PhoneStepsDemo" },
  { file: "src/remotion/components/NumberHero.tsx", interfaceName: "NumberHeroProps", fnName: "NumberHero" },
  { file: "src/remotion/components/ProgressSteps.tsx", interfaceName: "ProgressStepsProps", fnName: "ProgressSteps" },
  { file: "src/remotion/components/CTAEndCard.tsx", interfaceName: "CTAEndCardProps", fnName: "CTAEndCard" },
  { file: "src/remotion/components/DataSourceCard.tsx", interfaceName: "DataSourceCardProps", fnName: "DataSourceCard" },
  { file: "src/remotion/components/ComparisonTable.tsx", interfaceName: "ComparisonTableProps", fnName: "ComparisonTable" },
  { file: "src/remotion/components/WarningCard.tsx", interfaceName: "WarningCardProps", fnName: "WarningCard" },
];

let updated = 0;

for (const t of targets) {
  let src = readFileSync(t.file, "utf-8");
  if (src.includes("bgVariant?: BackgroundVariant")) {
    console.log(`[skip already-has-prop] ${t.file}`);
    continue;
  }

  // 1. Add bgVariant to the props interface.
  // Find: export interface XXX {  ...  }
  const ifaceRegex = new RegExp(
    `(export interface ${t.interfaceName} \\{[\\s\\S]*?)(\\n\\})`,
    "m",
  );
  const ifaceMatch = src.match(ifaceRegex);
  if (!ifaceMatch) {
    console.log(`[FAIL: no interface match] ${t.file}`);
    continue;
  }
  src = src.replace(ifaceRegex, `$1\n  bgVariant?: BackgroundVariant;$2`);

  // 2. Add bgVariant to the destructured prop list.
  // Find: export const XXX: React.FC<XXXProps> = ({ ... }) => {
  const fnRegex = new RegExp(
    `(export const ${t.fnName}: React\\.FC<${t.interfaceName}> = \\(\\{[\\s\\S]*?)(\\n\\}\\) =>)`,
    "m",
  );
  const fnMatch = src.match(fnRegex);
  if (!fnMatch) {
    console.log(`[FAIL: no fn match] ${t.file}`);
    continue;
  }
  src = src.replace(fnRegex, `$1\n  bgVariant,$2`);

  writeFileSync(t.file, src);
  updated++;
  console.log(`[updated] ${t.file}`);
}

console.log(`\nProcessed: ${updated} / ${targets.length}`);
