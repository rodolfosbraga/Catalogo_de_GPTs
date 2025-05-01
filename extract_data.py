import json
from bs4 import BeautifulSoup

def extract_catalog_data(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    catalog = []
    category_blocks = soup.find_all('div', class_='category-block')

    for block in category_blocks:
        category_name_tag = block.find('h2')
        if not category_name_tag:
            continue
        category_name = category_name_tag.get_text(strip=True)
        category_data = {
            "category": category_name,
            "gpts": []
        }

        details_tags = block.find_all('details')
        for details in details_tags:
            summary_tag = details.find('summary')
            content_div = details.find('div', class_='content')
            if not summary_tag or not content_div:
                continue

            gpt_name = summary_tag.get_text(strip=True)
            link = content_div.find('a')
            link_href = link['href'] if link else None
            paragraphs = content_div.find_all('p')
            description = None
            tools = None
            prompt_ideal = None

            for p in paragraphs:
                text = p.get_text(strip=True)
                if text.startswith('Descrição:'):
                    description = text.replace('Descrição:', '', 1).strip()
                elif text.startswith('Ferramentas:'):
                    tools = text.replace('Ferramentas:', '', 1).strip()
                elif text.startswith('Prompt Ideal:'):
                    prompt_ideal = text.replace('Prompt Ideal:', '', 1).strip()
                # Handle case where link is in a <p> tag but not <a>
                elif link_href is None and 'http' in text:
                    # Basic extraction, might need refinement
                    link_href = text.split(':')[-1].strip() if ':' in text else text.strip()


            category_data["gpts"].append({
                "name": gpt_name,
                "link": link_href,
                "description": description,
                "tools": tools,
                "prompt_ideal": prompt_ideal
            })
        
        if category_data["gpts"]:
             catalog.append(category_data)

    return catalog

# Read the HTML file
file_path = '/home/ubuntu/upload/index.html'
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
except FileNotFoundError:
    print(f"Erro: Arquivo HTML não encontrado em {file_path}")
    exit()

# Extract data
catalog_data = extract_catalog_data(html_content)

# Define output path within the Next.js project
output_path = '/home/ubuntu/catalogo-gpts-pwa/src/lib/catalog_data.json'

# Save data to JSON file
try:
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(catalog_data, f, ensure_ascii=False, indent=2)
    print(f"Dados extraídos e salvos em {output_path}")
except IOError as e:
    print(f"Erro ao salvar o arquivo JSON: {e}")

