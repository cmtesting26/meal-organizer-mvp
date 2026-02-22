# Recipe Parser Implementation - Backend Engineer

## 🎯 Your Mission

Build the **Recipe Parser Module** that extracts recipe data from URLs. This is the **critical path** for Sprint 3!

**Goal**: 80%+ success rate on common recipe sites

---

## 📁 Files You'll Work On

**Created for you (starter templates):**

```
meal-organizer-mvp/
├── src/
│   ├── types/
│   │   └── recipe.ts          ✅ DONE - TypeScript interfaces defined
│   └── lib/
│       └── recipeParser.ts    🚧 TODO - Implement TODOs in this file
└── tests/
    └── unit/
        └── recipeParser.test.ts  🚧 TODO - Write/uncomment tests
```

**You need to create:**

```
src/lib/schemaParser.ts    - Schema.org JSON-LD parsing logic
src/lib/heuristicParser.ts - HTML pattern matching fallback
```

---

## 🚀 Quick Start

### 1. Review the starter code

Open `/home/claude/meal-organizer-mvp/src/lib/recipeParser.ts`

This file has the main structure with TODO comments showing what to implement.

### 2. Implement the TODOs

**In `recipeParser.ts`:**

- ✅ Main orchestration is done
- 🚧 Implement `fetchRecipeHtml()` CORS handling
- 🚧 Implement `parseSchemaOrg()` function
- 🚧 Implement `parseHeuristic()` function

**Create `schemaParser.ts`** (recommended):

Extract schema.org parsing logic into separate module for clarity:

```typescript
export function parseSchemaOrgRecipe(html: string): ParsedRecipe {
  // Find <script type="application/ld+json"> tags
  // Parse JSON
  // Look for @type: "Recipe"
  // Extract data
}
```

**Create `heuristicParser.ts`** (recommended):

Extract heuristic parsing into separate module:

```typescript
export function parseHeuristicRecipe(html: string): ParsedRecipe {
  // Find title in <h1>, meta tags
  // Find ingredients in lists
  // Find instructions in ordered lists
  // Find image in meta og:image
}
```

### 3. Write tests as you go

Open `/home/claude/meal-organizer-mvp/tests/unit/recipeParser.test.ts`

Uncomment test cases and implement them. Use the helper functions provided.

### 4. Test with real URLs

Try parsing these common recipe sites:

```typescript
// Manual testing (add to a test file or script)
const testUrls = [
  'https://www.allrecipes.com/recipe/...',
  'https://www.bonappetit.com/recipe/...',
  'https://www.seriouseats.com/...',
];

for (const url of testUrls) {
  const result = await parseRecipeFromUrl(url);
  console.log(`${url}: ${result.success ? '✅' : '❌'}`);
}
```

---

## 📚 Technical Implementation Guide

### Schema.org Parsing (Primary Strategy)

**Look for JSON-LD scripts:**

```typescript
// In parseSchemaOrg()
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');
const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

for (const script of scripts) {
  try {
    const data = JSON.parse(script.textContent || '');
    
    // Check if it's a Recipe
    if (data['@type'] === 'Recipe') {
      return {
        title: data.name || '',
        ingredients: parseIngredients(data.recipeIngredient),
        instructions: parseInstructions(data.recipeInstructions),
        imageUrl: extractImage(data.image),
        success: true
      };
    }
  } catch (e) {
    continue; // Try next script
  }
}

return { title: '', ingredients: [], instructions: [], success: false };
```

**Handle different formats:**

```typescript
function parseIngredients(ingredient: any): string[] {
  if (Array.isArray(ingredient)) return ingredient;
  if (typeof ingredient === 'string') return [ingredient];
  return [];
}

function parseInstructions(instructions: any): string[] {
  // String
  if (typeof instructions === 'string') {
    return instructions.split('\n').filter(s => s.trim());
  }
  
  // Array of strings
  if (Array.isArray(instructions)) {
    return instructions.map(item => {
      if (typeof item === 'string') return item;
      if (item.text) return item.text;
      return '';
    }).filter(s => s);
  }
  
  return [];
}
```

### Heuristic Parsing (Fallback Strategy)

**Find title:**

```typescript
const title = 
  doc.querySelector('h1')?.textContent ||
  doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
  doc.title;
```

**Find ingredients:**

```typescript
// Look for lists with "ingredient" in class or id
const ingredientLists = doc.querySelectorAll(
  '[class*="ingredient"] li, [id*="ingredient"] li, .ingredients li'
);

const ingredients = Array.from(ingredientLists)
  .map(li => li.textContent?.trim() || '')
  .filter(s => s && s.length > 2); // Filter empty and too short
```

**Find instructions:**

```typescript
const instructionElements = doc.querySelectorAll(
  '[class*="instruction"] li, [class*="step"] li, ' +
  '[class*="direction"] li, ol li'
);

const instructions = Array.from(instructionElements)
  .map(el => el.textContent?.trim() || '')
  .filter(s => s && s.length > 5);
```

**Find image:**

```typescript
const imageUrl = 
  doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
  doc.querySelector('article img')?.getAttribute('src') ||
  doc.querySelector('img[class*="recipe"]')?.getAttribute('src');
```

### CORS Handling

```typescript
async function fetchRecipeHtml(url: string): Promise<string> {
  // Try direct fetch
  try {
    const response = await fetch(url);
    if (response.ok) return await response.text();
  } catch (error) {
    // CORS blocked
  }
  
  // Try proxy
  const proxyUrl = import.meta?.env?.VITE_CORS_PROXY_URL;
  if (proxyUrl) {
    const response = await fetch(`${proxyUrl}?url=${encodeURIComponent(url)}`);
    if (response.ok) return await response.text();
  }
  
  throw new Error('Could not fetch URL');
}
```

---

## ✅ Definition of Done

Your task is complete when:

- [ ] `parseSchemaOrg()` extracts recipes from schema.org markup
- [ ] `parseHeuristic()` extracts recipes from HTML patterns
- [ ] `fetchRecipeHtml()` handles CORS with proxy fallback
- [ ] Unit tests are written and passing
- [ ] Manually tested with 5+ recipe URLs
- [ ] Code uses TypeScript with proper types
- [ ] Success rate documented (aim for 80%+)
- [ ] Task status updated to "In Review"

---

## 🧪 Testing Checklist

**Unit tests (run with `npm test`):**

- [ ] Schema.org parsing with valid JSON-LD
- [ ] Heuristic parsing with HTML patterns
- [ ] Ingredient array vs string handling
- [ ] Instruction array vs string handling
- [ ] Image URL extraction
- [ ] Error handling for invalid HTML
- [ ] CORS proxy fallback

**Manual testing:**

- [ ] Test with AllRecipes URL
- [ ] Test with Bon Appétit URL
- [ ] Test with Serious Eats URL
- [ ] Test with personal blog URL
- [ ] Test with invalid URL
- [ ] Document success rate

---

## 📊 Success Metrics

**Target: 80%+ success rate**

Test with 20 diverse recipe sites (QA will validate):
- 10 major recipe sites (AllRecipes, NYT Cooking, etc.)
- 5 food blogs
- 5 international sites

Success = recipe data extracted (even if partial)

---

## 🆘 Need Help?

**Stuck on something?**

1. Check the [Schema.org Recipe spec](https://schema.org/Recipe)
2. Look at example sites in DevTools (Network tab → HTML response)
3. Comment on the [task in Notion](https://www.notion.so/303c32fbbc948183881fcb353c503484)
4. Tag Tech Lead if blocked >30 min

**Common issues:**

- **CORS errors**: Proxy not configured yet? Ask DevOps Engineer
- **Parse failures**: Check if site uses schema.org or custom format
- **Empty results**: Add console.logs to debug parsing steps

---

## 🔗 Resources

**Implementation Plan**: [Phase 3 Details](https://www.notion.so/302c32fbbc948102bbebdbc6abb915bc)

**Design Spec**: [Import Flow](https://www.notion.so/303c32fbbc9481dabb9ec2319d5891ce)

**Task in Notion**: [Build Recipe Parser Module](https://www.notion.so/303c32fbbc948183881fcb353c503484)

**Schema.org Spec**: https://schema.org/Recipe

---

## 🎯 Focus Areas

**High priority:**
1. Schema.org parser (70-80% of sites)
2. Error handling (graceful degradation)
3. TypeScript types (type safety)

**Medium priority:**
4. Heuristic parser (10-15% additional coverage)
5. Unit tests (prevent regressions)

**Lower priority:**
6. Perfect extraction (partial data is OK)
7. Image quality (any image is fine)

---

**You've got this! The parser is the heart of the import feature. Make it reliable! 🚀**

---

## 📝 Commit Message Template

When you're done:

```
feat(parser): implement recipe parser with schema.org + heuristics

- Add schema.org JSON-LD parser (primary)
- Add heuristic HTML parser (fallback)
- Handle CORS with proxy support
- Add unit tests for both strategies
- Tested with [X] sites, [Y]% success rate

Closes: Sprint 3 - Build Recipe Parser Module
```
