from openai import OpenAI
import os
import json

def get_llm_client(api_key=None, provider='openai'):
    """Get an LLM client based on the provider."""
    if api_key:
        return OpenAI(api_key=api_key)
    else:
        # Use default API key from environment
        return OpenAI()

def analyze_resume(resume_text, api_key=None, model='gpt-4.1-mini'):
    """Analyze a resume using LLM and extract structured information."""
    client = get_llm_client(api_key)
    
    prompt = f"""Analyze the following resume and extract structured information in JSON format.

Resume:
{resume_text}

Please provide the analysis in the following JSON format:
{{
    "sectors": ["sector1", "sector2", ...],
    "roles": ["role1", "role2", ...],
    "skills": ["skill1", "skill2", ...],
    "summary": "A brief summary of the candidate's profile"
}}

Focus on:
- Identifying the main sectors/industries the candidate has worked in
- Key roles and positions held
- Technical and soft skills
- A concise summary highlighting the candidate's strengths and experience

Respond ONLY with valid JSON, no additional text."""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert HR analyst specializing in resume analysis."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse JSON response
        analysis = json.loads(result)
        
        return {
            'status': 'success',
            'analysis': analysis
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e)
        }

def analyze_company(company_name, website=None, job_url=None, api_key=None, model='gpt-4.1-mini'):
    """Analyze a company using LLM and extract key information."""
    client = get_llm_client(api_key)
    
    company_info = f"Company Name: {company_name}"
    if website:
        company_info += f"\nWebsite: {website}"
    if job_url:
        company_info += f"\nJob Posting URL: {job_url}"
    
    prompt = f"""Analyze the following company information and provide a structured analysis in JSON format.

{company_info}

Please provide the analysis in the following JSON format:
{{
    "summary": "A brief summary of the company (mission, products, values)",
    "focus_areas": ["area1", "area2", ...],
    "requirements": ["requirement1", "requirement2", ...]
}}

Focus on:
- Company mission, products, and core values
- Main focus areas and technologies used
- Key requirements for typical roles (if job posting is provided)

Respond ONLY with valid JSON, no additional text."""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert business analyst specializing in company research."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse JSON response
        analysis = json.loads(result)
        
        return {
            'status': 'success',
            'analysis': analysis
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e)
        }

def generate_cover_letter(profile, company, language='en', tone='formal', api_key=None, model='gpt-4.1-mini'):
    """Generate a personalized cover letter using LLM."""
    client = get_llm_client(api_key)
    
    prompt = f"""Generate a professional cover letter based on the following information:

Candidate Profile:
- Sectors: {', '.join(profile.get('sectors', []))}
- Roles: {', '.join(profile.get('roles', []))}
- Skills: {', '.join(profile.get('skills', []))}
- Summary: {profile.get('summary', '')}

Company Information:
- Name: {company.get('name', '')}
- Summary: {company.get('summary', '')}
- Focus Areas: {', '.join(company.get('focus_areas', []))}
- Requirements: {', '.join(company.get('requirements', []))}

Language: {language}
Tone: {tone}

Please generate a cover letter that:
1. Is 150-300 words long
2. Highlights 2-3 specific matches between the candidate's skills and company requirements
3. Demonstrates genuine interest in the company
4. Is written in a {tone} tone
5. Is in {language} language

Respond ONLY with the cover letter text, no additional formatting or explanations."""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert career counselor specializing in writing compelling cover letters."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        letter = response.choices[0].message.content.strip()
        
        return {
            'status': 'success',
            'letter': letter
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e)
        }

def validate_api_key(api_key, provider='openai'):
    """Validate an API key by making a test request."""
    try:
        client = OpenAI(api_key=api_key)
        # Make a minimal test request
        response = client.chat.completions.create(
            model='gpt-4.1-nano',
            messages=[{"role": "user", "content": "test"}],
            max_tokens=5
        )
        return True
    except Exception as e:
        return False

