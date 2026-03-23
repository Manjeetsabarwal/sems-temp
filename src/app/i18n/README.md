# Multi-Language Support (i18n)

This application supports multiple languages: English, Sanskrit, Hindi, and Spanish.

## Usage

### Basic Usage in Components

```tsx
import { useLanguage } from '../i18n';

function MyComponent() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('common.dashboard')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Translation Keys

Translation keys use dot notation for nested objects:
- `common.save` → "Save" (English), "सहेजें" (Hindi), "सङ्ग्रहः" (Sanskrit), "Guardar" (Spanish)
- `students.title` → "Students" (English), "छात्र" (Hindi), etc.

### Available Translation Namespaces

- `common` - Common UI elements (buttons, labels, status)
- `auth` - Authentication related text
- `students` - Student module translations
- `teachers` - Teacher module translations
- `classes` - Class module translations
- `sections` - Section module translations
- `subjects` - Subject module translations
- `exams` - Exam module translations
- `marks` - Marks module translations
- `results` - Results module translations
- `reportCards` - Report card translations
- `settings` - Settings translations

### Changing Language

The language selector is available in the Header component. Users can select their preferred language, and it will be saved to localStorage for persistence.

### Adding New Translations

1. Add the translation key to all language files:
   - `src/app/i18n/translations/en.json`
   - `src/app/i18n/translations/hi.json`
   - `src/app/i18n/translations/sa.json`
   - `src/app/i18n/translations/es.json`

2. Use the key in your component:
   ```tsx
   {t('yourNamespace.yourKey')}
   ```

### Language Codes

- `en` - English
- `hi` - Hindi (हिन्दी)
- `sa` - Sanskrit (संस्कृतम्)
- `es` - Spanish (Español)
