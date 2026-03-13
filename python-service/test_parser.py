from parser import extract_keywords, parse_resume_sections

# Test resume text
test_resume = """
John Doe
Software Engineer

SUMMARY
Experienced full-stack developer with 5+ years in web development

EXPERIENCE
Senior Software Engineer at TechCorp (2020-2023)
• Developed microservices using Python and Django
• Built REST APIs with Flask and PostgreSQL
• Implemented CI/CD pipelines using Docker and Kubernetes
• Worked with AWS services including EC2, S3, and Lambda

Software Developer at StartupXYZ (2018-2020)  
• Created React applications with TypeScript
• Developed Node.js backend services
• Used MongoDB for data storage
• Implemented machine learning models using TensorFlow

SKILLS
Programming Languages: Python, JavaScript, TypeScript, Java
Frameworks: React, Django, Flask, Express.js
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS, Docker, Kubernetes
Tools: Git, Jenkins, Jira

PROJECTS
E-commerce Platform - Built full-stack web application using React and Django
ML Recommendation System - Developed recommendation engine using Python and TensorFlow
Chat Application - Real-time messaging app with Node.js and Socket.io

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2014-2018)
"""

def test_parser():
    print("=== Testing Enhanced Parser ===\n")
    
    # Test section parsing
    sections = parse_resume_sections(test_resume)
    print("📋 SECTIONS FOUND:")
    for section, content in sections.items():
        print(f"  {section}: {len(content)} lines")
    print()
    
    # Test keyword extraction
    keywords = extract_keywords(test_resume)
    
    print("🔧 EXTRACTED SKILLS:")
    for skill in keywords['skills']:
        print(f"  • {skill}")
    print()
    
    print("🚀 EXTRACTED PROJECTS:")
    for project in keywords['projects']:
        print(f"  • {project}")
    print()
    
    print("💼 EXTRACTED EXPERIENCE:")
    for exp in keywords['experience']:
        print(f"  • {exp}")
    print()
    
    print("📊 SUMMARY:")
    print(f"  Skills found: {len(keywords['skills'])}")
    print(f"  Projects found: {len(keywords['projects'])}")
    print(f"  Experience items: {len(keywords['experience'])}")
    print(f"  Sections parsed: {len(sections)}")

if __name__ == "__main__":
    test_parser()