#!/usr/bin/env python3
"""
UX Design Review using Gemini
Sends current design context to Gemini for professional critique
"""

import os
from google import genai
from google.genai import types

# Initialize client
client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

# Current design context
DESIGN_CONTEXT = """
# Portfolio Site Design Review Request

## Design System Summary
- **Theme**: Dark mode primary (#0d0d0d background)
- **Accent**: Warm amber (#f59e0b)
- **Typography**: Inter (display), JetBrains Mono (code/UI)
- **Aesthetic**: "Forge/Blueprint" - engineering grid overlays, metallic animations
- **Personality**: Craftsman, builder, honest, direct

## Current Sections
1. **Hero** - Centered title, tagline, two CTAs ("See My Work", "Ask Me Anything")
2. **About** - Bio text + 3 stat cards (M.Ed., 10+ Years, LLM Trained)
3. **Journey** - Vertical timeline with 6 career stages, each has "Ask me about this" button + STAR accordion
4. **Skills** - 3-column layout (Strong / Moderate / "I'll Tell You") with confidence bars
5. **Job Fit** - Textarea for JD input, "Analyze Fit" button, results with score visualization
6. **Review** - Card grid with filters (All/Experience/Projects/Skills), sort options
7. **Projects** - 3 project cards with tags
8. **Writing** - Blog posts grid
9. **Connect** - 3 social links

## Interactive Features
- Chat modal (floating button + nav trigger)
- STAR accordions in Journey section
- Skill tooltips on hover
- Job fit analysis with animated score
- Review cards with detail modal

## Animation Approach
- Forge "press" effect on elements entering viewport
- Blueprint grid overlay (subtle)
- Staggered reveals on grids
- Amber glow on hover states
"""

REVIEW_PROMPT = """
You are a senior UX designer at a top tech company (Google, Apple, Stripe level).
Review this portfolio site design with brutal honesty.

{context}

## Review These Areas:

### 1. Typography & Spacing
- Is the hierarchy clear? Can you scan quickly?
- Does the spacing feel cramped or too loose?
- Any font size/weight issues?

### 2. Color & Accent
- Does the amber accent work on dark? Contrast issues?
- Is there enough visual variety or is it monotonous?
- Suggestions for gradient or secondary accent use?

### 3. Animations & Micro-interactions
- Is "forge/blueprint" aesthetic distinctive or gimmicky?
- What's missing? What would feel more polished?
- Any performance concerns?

### 4. Cards & Containers
- Border and shadow treatments - modern or dated?
- Hover states - engaging or distracting?
- Visual consistency across card types?

### 5. Chat Modal
- Does it feel native to the site or bolted on?
- What would make it feel more premium?

### 6. Mobile Experience
- What likely breaks on mobile?
- Touch target sizes?
- Navigation complexity?

### 7. Overall Impression
- What's the ONE thing that would level this up?
- What feels "template-y" that needs personality?
- Would a recruiter remember this site? Why/why not?

## Output Format
For each area, provide:
1. **Current State** (what you observe)
2. **Issue** (specific problem)
3. **Recommendation** (actionable fix with CSS/design specifics)
4. **Priority** (High/Medium/Low)

End with your TOP 3 highest-impact recommendations.
"""

def run_review():
    """Run the Gemini UX review"""

    print("🔍 Requesting UX review from Gemini...\n")

    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=REVIEW_PROMPT.format(context=DESIGN_CONTEXT),
        config=types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=4096,
        )
    )

    print("=" * 60)
    print("GEMINI UX DESIGN REVIEW")
    print("=" * 60)
    print(response.text)
    print("=" * 60)

    # Save to file
    with open('gemini-review-output.md', 'w') as f:
        f.write("# Gemini UX Design Review\n\n")
        f.write(response.text)

    print("\n✅ Review saved to gemini-review-output.md")

if __name__ == '__main__':
    if not os.environ.get('GEMINI_API_KEY'):
        print("❌ Please set GEMINI_API_KEY environment variable")
        print("   export GEMINI_API_KEY='your-key-here'")
        exit(1)

    run_review()
