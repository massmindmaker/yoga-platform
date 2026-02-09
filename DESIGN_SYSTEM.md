# Дизайн-система Yoga Platform

## Цветовая палитра

### Primary (Основной мятный)
```
--yoga-primary: #3BCEAC        // Основной цвет
--yoga-primary-light: #5EEAD4  // Светлый
--yoga-primary-dark: #2A9D8F   // Темный
--yoga-primary-50: #F0FDF9
--yoga-primary-100: #CCFBF1
--yoga-primary-200: #99F6E4
--yoga-primary-300: #5EEAD4
--yoga-primary-400: #2DD4BF
--yoga-primary-500: #14B8A6
--yoga-primary-600: #3BCEAC
--yoga-primary-700: #0D9488
--yoga-primary-800: #0F766E
--yoga-primary-900: #115E59
```

### Secondary Orange (Для энергии/утра)
```
--yoga-orange: #F97316
--yoga-orange-light: #FDBA74
--yoga-orange-dark: #EA580C
--yoga-orange-50: #FFF7ED
```

### Tertiary Teal (Для спокойствия/вечера)
```
--yoga-teal: #14B8A6
--yoga-teal-light: #5EEAD4
--yoga-teal-dark: #0D9488
--yoga-teal-50: #F0FDFA
```

### Semantic Colors
```
--yoga-success: #10B981      // Успех
--yoga-warning: #F59E0B      // Предупреждение
--yoga-error: #EF4444        // Ошибка
--yoga-info: #3B82F6         // Информация
```

### Gray Scale
```
--yoga-gray-50: #F9FAFB   // Фон карточек
--yoga-gray-100: #F3F4F6  // Фон страниц
--yoga-gray-200: #E5E7EB  // Границы
--yoga-gray-300: #D1D5DB
--yoga-gray-400: #9CA3AF  // Вторичный текст
--yoga-gray-500: #6B7280
--yoga-gray-600: #4B5563  // Основной текст
--yoga-gray-700: #374151
--yoga-gray-800: #1F2937  // Темный текст
--yoga-gray-900: #111827
```

## Градиенты

```css
--gradient-primary: linear-gradient(135deg, #3BCEAC 0%, #2DD4BF 50%, #14B8A6 100%);
--gradient-orange: linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FBBF24 100%);
--gradient-teal: linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #06B6D4 100%);
--gradient-success: linear-gradient(135deg, #10B981 0%, #34D399 100%);
```

## Использование цветов

### Кнопки
- **Primary**: `bg-[#3BCEAC]` или `bg-yoga-primary`
- **Hover**: `hover:bg-[#2A9D8F]` или `hover:bg-yoga-primary-dark`
- **Secondary**: `bg-white border-2 border-[#3BCEAC] text-[#3BCEAC]`

### Карточки
- **Background**: `bg-white` или `bg-[#F9FAFB]`
- **Border**: `border border-[#E5E7EB]`
- **Shadow**: `shadow-sm` или `shadow-lg`

### Текст
- **Primary**: `text-[#1F2937]` (gray-800)
- **Secondary**: `text-[#6B7280]` (gray-500)
- **Accent**: `text-[#3BCEAC]` (primary)

### Интенсивы
- **Background bar**: `bg-gradient-to-r from-orange-500 to-red-500`
- **Badge**: `bg-orange-100 text-orange-700`

### Регулярные группы
- **Background bar**: `bg-gradient-to-r from-[#3BCEAC] to-[#14B8A6]`
- **Badge**: `bg-[#CCFBF1] text-[#0D9488]`

## Компоненты

### Кнопки

**Primary Button:**
```tsx
<Button className="bg-[#3BCEAC] hover:bg-[#2A9D8F] text-white shadow-md hover:shadow-lg transition-all">
  Текст кнопки
</Button>
```

**Secondary Button:**
```tsx
<Button className="bg-white border-2 border-[#3BCEAC] text-[#3BCEAC] hover:bg-[#F0FDF9]">
  Текст кнопки
</Button>
```

**Danger Button:**
```tsx
<Button className="bg-[#EF4444] hover:bg-[#DC2626] text-white">
  Удалить
</Button>
```

### Карточки

**Group Card:**
```tsx
<Card className="border-0 shadow-sm hover:shadow-lg transition-all">
  <div className="h-1 bg-gradient-to-r from-[#3BCEAC] to-[#14B8A6]" /> // Регулярная
  {/* или */}
  <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" /> // Интенсив
</Card>
```

**Voting Card:**
```tsx
<div className="bg-gradient-to-r from-[#F0FDF9] to-white rounded-lg border border-[#CCFBF1]">
  <div className="h-2 bg-gradient-to-r from-[#3BCEAC] to-[#14B8A6] rounded-full" />
</div>
```

### Бейджи

**Type Badge - Regular:**
```tsx
<Badge className="bg-[#CCFBF1] text-[#0D9488]">
  Регулярные
</Badge>
```

**Type Badge - Intensive:**
```tsx
<Badge className="bg-orange-100 text-orange-700">
  Интенсив
</Badge>
```

**Status Badge - Active:**
```tsx
<Badge className="bg-[#D1FAE5] text-[#059669]">
  Активно
</Badge>
```

**Status Badge - Inactive:**
```tsx
<Badge className="bg-gray-100 text-gray-600">
  Неактивно
</Badge>
```

### Иконки и индикаторы

**Loading Spinner:**
```tsx
<Loader2 className="w-8 h-8 animate-spin text-[#3BCEAC]" />
```

**Success Icon:**
```tsx
<div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
  <Check className="w-5 h-5 text-[#10B981]" />
</div>
```

**Avatar:**
```tsx
<Avatar className="bg-[#CCFBF1]">
  <AvatarFallback className="bg-[#CCFBF1] text-[#0D9488]">
    ИФ
  </AvatarFallback>
</Avatar>
```

## Типографика

### Заголовки
- **H1**: `text-2xl font-bold text-[#1F2937]`
- **H2**: `text-xl font-semibold text-[#1F2937]`
- **H3**: `text-lg font-semibold text-[#1F2937]`

### Текст
- **Body**: `text-sm text-[#4B5563]`
- **Secondary**: `text-xs text-[#6B7280]`
- **Caption**: `text-[10px] text-[#9CA3AF]`

## Отступы и размеры

### Карточки
- Padding: `p-4`
- Border radius: `rounded-xl` (0.75rem)
- Gap между карточками: `space-y-3`

### Кнопки
- Padding: `px-4 py-2`
- Border radius: `rounded-lg` (0.5rem)
- Icon size: `w-4 h-4`

## Тени

```css
shadow-sm    /* Минимальная тень для карточек */
shadow-md    /* Средняя тень для кнопок */
shadow-lg    /* Большая тень для модалок */
shadow-[#3BCEAC]/20  /* Цветная тень с прозрачностью */
```

## Примеры использования

### Страница групп
```tsx
<div className="min-h-screen bg-[#F9FAFB]">
  <div className="bg-white border-b">
    <h1 className="text-2xl font-bold text-[#1F2937]">Мои группы</h1>
    <Button className="bg-gradient-to-r from-[#3BCEAC] to-[#14B8A6] text-white">
      <Plus className="w-4 h-4 mr-2" />
      Создать
    </Button>
  </div>
</div>
```

### Карточка голосования
```tsx
<div className="bg-gradient-to-r from-[#F0FDF9] to-white rounded-xl p-4 border border-[#CCFBF1]">
  <h4 className="font-medium text-[#1F2937]">{voting.title}</h4>
  <div className="w-full h-2 bg-[#E5E7EB] rounded-full">
    <div className="h-full bg-gradient-to-r from-[#3BCEAC] to-[#14B8A6] rounded-full" 
         style={{ width: `${progress}%` }} />
  </div>
</div>
```
