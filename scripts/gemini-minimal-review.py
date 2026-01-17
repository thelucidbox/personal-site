#!/usr/bin/env python3
"""
Gemini Review: Minimal Theme - Image Suggestions
"""

import os
import sys

# Add parent directory to path to access .env
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google import genai

# Load API key from ALOS project or environment
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    env_path = os.path.expanduser('~/Projects/ALOS/.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    api_key = line.strip().split('=', 1)[1].strip('"\'')
                    break

if not api_key:
    print("Error: GEMINI_API_KEY not found")
    sys.exit(1)

client = genai.Client(api_key=api_key)

# Read the minimal.css file
css_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'css', 'minimal.css')
with open(css_path, 'r') as f:
    css_content = f.read()

prompt = """
You are a senior UX/UI designer reviewing a portfolio website's "Minimal" theme.

## DESIGN CONTEXT

This is a "Millennial Chic" minimal theme for a personal portfolio site. The design features:

**Color Palette:**
- Forest Green (#166534) - primary accent
- Sage (#a3a78e) - secondary accent
- Warm Cream (#faf8f5) - primary background
- Off-white (#f5f2ed) - secondary background
- White (#ffffff) - card backgrounds
- Warm gray text (#1f2937, #6b7280)

**Typography:**
- Plus Jakarta Sans - clean, modern sans-serif
- Font weights: 400, 500, 600, 700

**Design Elements:**
- Light, airy feel with generous whitespace
- Rounded corners (8-12px border radius)
- Subtle borders (#e5e2dd)
- Soft shadows on hover
- No particles or cursor effects (intentionally minimal)
- Alternating cream/warm backgrounds between sections

**Sections (in order):**
1. Hero - Name, tagline, CTA buttons
2. About - Bio text with stat cards (M.Ed., 10+ Years SaaS, LLM)
3. Journey - Career timeline with role cards
4. Skills - Three-column skill categorization
5. Job Fit - JD analysis tool
6. Review - Browsable experience cards
7. Projects - Project cards
8. Blog/Writing - Blog post cards
9. Connect - Social link tiles (LinkedIn, GitHub, Email)
10. Footer

## THE QUESTION

The owner feels something is missing from the design. They want to add **3-4 images** that appear as you scroll down the page. These could be:
- Abstract design patterns
- Cool images that are stylized/pixelated
- Illustrations
- Or other visual elements

## PLEASE PROVIDE:

1. **Overall Assessment**: What's working well and what feels like it's missing?

2. **Image Recommendations**: Suggest 3-4 specific images/visual elements to add:
   - What type of image (pattern, illustration, photo, abstract)
   - Where to place it (which section, position)
   - Style treatment (should it be muted, have an overlay, be pixelated, etc.)
   - How it complements the minimal aesthetic without overwhelming it

3. **Specific Ideas**: Give concrete examples:
   - "A soft botanical illustration of monstera leaves behind the About section, at 10% opacity"
   - "An abstract geometric pattern divider between Journey and Skills"
   - etc.

4. **Implementation Tips**: How to integrate these visually while maintaining the clean, minimal feel

5. **Alternative Approaches**: If images aren't the answer, what else might fill the "missing something" feeling?

Remember: This is a MINIMAL theme. Any additions should enhance, not clutter. Think editorial design, not busy web design.
"""

print("Sending review request to Gemini...\n")
print("=" * 60)

response = client.models.generate_content(
    model='gemini-2.0-flash',
    contents=prompt
)

print(response.text)
print("\n" + "=" * 60)
