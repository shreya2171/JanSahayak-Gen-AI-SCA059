"""Basic protection against prompt injection hidden in uploaded documents.

An attacker could upload a PDF containing text such as "Ignore all previous
instructions and ...". When that text is retrieved and placed in the prompt,
the model might obey it. We reduce this risk in two ways:
  1. here: remove control characters and neutralise instruction-like phrases;
  2. in services/prompts.py: wrap retrieved text in delimiters and tell the
     model that it is untrusted reference data, never instructions.
This is a mitigation, not a guarantee.
"""
import re

_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_INJECTION_PATTERNS = [
    r"ignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)",
    r"disregard (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)",
    r"forget (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)",
    r"you are now\b",
    r"act as (an? )?(different|new|unrestricted)",
    r"(reveal|print|show|repeat) (your |the )?(system )?(prompt|instructions)",
    r"system prompt",
    r"developer mode",
    r"jailbreak",
    r"</?(system|assistant|user|context|instructions?)>",
    r"\[/?(INST|SYS)\]",
]
_INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)
REDACTION = "[removed: instruction-like text]"


def sanitize(text: str) -> tuple[str, int]:
    """Return (clean_text, number_of_phrases_neutralised)."""
    text = _CONTROL.sub(" ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text, count = _INJECTION_RE.subn(REDACTION, text)
    return text.strip(), count
