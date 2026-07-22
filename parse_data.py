import json
import re
import urllib.request

# Ajout de nombreuses sources populaires (Markdown brut)
SOURCES = {
    # Vos sources initiales
    "free_for_dev": "https://raw.githubusercontent.com/ripienaar/free-for-dev/master/README.md",
    "awesome_osint": "https://raw.githubusercontent.com/jivoi/awesome-osint/master/README.md",
    # Nouvelles sources à fort volume d'outils
    "awesome_selfhosted": "https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md",
    "awesome_sysadmin": "https://raw.githubusercontent.com/awesome-foss/awesome-sysadmin/master/README.md",
    "awesome_sectools": "https://raw.githubusercontent.com/zbetcheckin/Awesome-SecTools/master/README.md",
    "awesome_cybersecurity": "https://raw.githubusercontent.com/sbilly/awesome-security/master/README.md",
    "public_apis": "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md",
    "awesome_cheatsheets": "https://raw.githubusercontent.com/LeCoupa/awesome-cheatsheets/master/README.md",
}


def fetch_markdown(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
        },
    )
    return urllib.request.urlopen(req, timeout=15).read().decode("utf-8")


def parse_readme(content, source_tag):
    data = []
    current_category = "Général"

    # Regex optimisé : supporte les puce `-`, `*` ou `+` et gère mieux la séparation avec la description
    link_pattern = re.compile(
        r"^[\*\-\+]\s*\[([^\]]+)\]\(([^)]+)\)(?:\s*[\-–—:]\s*(.*))?"
    )

    for line in content.splitlines():
        line = line.strip()

        # Détection des catégories (##, ###, ####)
        if line.startswith("#"):
            category_title = line.lstrip("#").strip()
            # Ignorer les titres généraux courts comme "Table of Contents"
            if category_title and not category_title.lower().startswith(
                "table of contents"
            ):
                current_category = category_title
            continue

        # Détection des liens
        match = link_pattern.match(line)
        if match:
            title, url, description = match.groups()
            url = url.strip()

            # Filtrer les ancres internes (#) et liens relatifs non pertinents
            if not url.startswith("#") and url.startswith("http"):
                data.append(
                    {
                        "title": title.strip(),
                        "url": url,
                        "description": (description or "").strip(),
                        "category": current_category,
                        "source": source_tag,
                    }
                )

    return data


if __name__ == "__main__":
    all_tools = []

    for name, url in SOURCES.items():
        print(f"Extraction de {name}...")
        try:
            raw_md = fetch_markdown(url)
            tools = parse_readme(raw_md, name)
            print(f"  -> {len(tools)} outils trouvés.")
            all_tools.extend(tools)
        except Exception as e:
            print(f"  -> Erreur sur {name}: {e}")

    # Suppression des doublons basés sur l'URL
    unique_tools = {tool["url"]: tool for tool in all_tools}.values()

    with open("tools.json", "w", encoding="utf-8") as f:
        json.dump(list(unique_tools), f, ensure_ascii=False, indent=2)

    print("-" * 40)
    print(f"Terminé ! {len(unique_tools)} outils uniques extraits dans tools.json.")