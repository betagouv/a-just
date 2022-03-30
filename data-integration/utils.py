import re

REGEX_NAC = re.compile(r"(\d\d[A-Z])")  # un NAC contient 2 chiffres et une lettre


def extract_nac(nac: str) -> str:
    if not isinstance(nac, str):
        return None
    match = REGEX_NAC.findall(nac)
    if len(match) == 0:
        return None
    else:
        return match[0]
