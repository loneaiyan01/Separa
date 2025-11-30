# 🚀 Quick Glass Reference - Copy & Paste Ready

## 🎨 Most Common Patterns

### Premium Card
```tsx
<div className="glass-card rounded-2xl p-6 frosted-edge hover:scale-[1.02] transition-all">
  <h3 className="text-xl font-bold text-white mb-2">Title</h3>
  <p className="text-slate-400">Description</p>
</div>
```

### Primary Button
```tsx
<Button className="glass-button premium-glow font-semibold">
  <Icon className="w-5 h-5 mr-2" />
  Click Me
</Button>
```

### Secondary Button
```tsx
<Button className="glass-subtle border-slate-600/50 hover:border-emerald-500/50">
  Secondary Action
</Button>
```

### Input Field
```tsx
<Input 
  className="glass-input h-12" 
  placeholder="Enter text..."
/>
```

### Section Container
```tsx
<div className="glass rounded-2xl p-8 mb-6">
  {/* Content */}
</div>
```

### Sidebar Panel
```tsx
<div className="glass-panel rounded-l-2xl p-6">
  {/* Sidebar content */}
</div>
```

### Empty State
```tsx
<div className="glass-card rounded-3xl p-12 text-center frosted-edge shimmer">
  <div className="glass-subtle rounded-2xl w-24 h-24 mx-auto mb-6 pulse-glow flex items-center justify-center">
    <Icon className="w-12 h-12 text-primary" />
  </div>
  <h3 className="text-2xl font-bold text-white mb-3">No Data</h3>
  <p className="text-slate-400 mb-8">Description text</p>
  <Button className="glass-button premium-glow">Action</Button>
</div>
```

### Loading State
```tsx
<div className="glass-card rounded-2xl p-8">
  <Loader2 className="w-10 h-10 text-primary animate-spin" />
</div>
```

### Header Section
```tsx
<div className="glass-strong rounded-2xl p-6 mb-8">
  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
    Page Title
  </h1>
  <p className="text-slate-400 text-lg mt-2">Subtitle</p>
</div>
```

### Metadata Display
```tsx
<div className="flex flex-col gap-2">
  <div className="glass-subtle p-3 rounded-lg flex items-center justify-between">
    <span className="text-slate-400 text-sm">Label</span>
    <span className="text-white font-semibold">Value</span>
  </div>
</div>
```

### Icon Container
```tsx
<div className="w-12 h-12 rounded-xl glass-subtle flex items-center justify-center">
  <Icon className="w-6 h-6 text-emerald-400" />
</div>
```

### Gradient Background Page
```tsx
<div className="min-h-screen gradient-bg p-8">
  {/* Page content */}
</div>
```

### Badge
```tsx
<span className="glass-button px-3 py-1.5 rounded-full text-xs font-bold">
  Badge Text
</span>
```

### Divider
```tsx
<div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-6" />
```

## 🎯 Glass Class Quick Pick

| Need | Use This |
|------|----------|
| Regular container | `.glass` |
| Stronger container | `.glass-strong` |
| Lighter background | `.glass-subtle` |
| Interactive card | `.glass-card` |
| Input field | `.glass-input` |
| Primary button | `.glass-button` |
| Sidebar/Panel | `.glass-panel` |

## ✨ Effect Combos

### Premium Card with All Effects
```tsx
className="glass-card rounded-2xl p-6 frosted-edge premium-glow hover:scale-[1.02] transition-all"
```

### Animated Button
```tsx
className="glass-button premium-glow hover:scale-105 transition-transform font-semibold"
```

### Fancy Input
```tsx
className="glass-input h-12 focus:ring-2 focus:ring-emerald-500/50"
```

### Staggered Grid Item
```tsx
<div className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
  <div className="glass-card rounded-2xl p-6">
    {/* Content */}
  </div>
</div>
```

## 🎨 Color Accent Patterns

### Emerald (Primary)
```tsx
className="glass-card border-2 border-emerald-500/30 bg-emerald-500/5"
```

### Rose (Danger)
```tsx
className="glass-card border-2 border-rose-500/30 bg-rose-500/5"
```

### Amber (Warning)
```tsx
className="glass-card border-2 border-amber-500/30 bg-amber-500/5"
```

### Blue (Info)
```tsx
className="glass-card border-2 border-blue-500/30 bg-blue-500/5"
```

## 📱 Responsive Patterns

### Mobile-Friendly Card
```tsx
<div className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8">
  {/* Content scales with screen size */}
</div>
```

### Mobile Panel
```tsx
<div className="fixed inset-0 md:relative glass-panel">
  {/* Full screen on mobile, sidebar on desktop */}
</div>
```

## 🔥 Pro Tips

1. **Stack effects** - Combine frosted-edge + premium-glow for hero elements
2. **Transition everything** - Always add `transition-all` or `transition-transform`
3. **Use hover states** - `hover:scale-[1.02]` for cards, `hover:scale-105` for buttons
4. **Stagger animations** - Add delays for lists/grids
5. **Custom scrollbar** - Add `custom-scrollbar` class to scrollable containers

## 🎬 Animation Delays

For sequential animations:
```tsx
{items.map((item, index) => (
  <div 
    key={item.id}
    className="animate-slide-up" 
    style={{ animationDelay: `${index * 0.05}s` }}
  >
    {/* Content */}
  </div>
))}
```

## 🌟 Special Effects

### Shimmer Loading
```tsx
<div className="glass-card shimmer">
  <div className="h-4 bg-slate-700/50 rounded mb-2" />
  <div className="h-4 bg-slate-700/50 rounded w-3/4" />
</div>
```

### Pulse Attention
```tsx
<div className="glass-card pulse-glow">
  Important content
</div>
```

### Gradient Text
```tsx
<h1 className="bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
  Gradient Title
</h1>
```

---

**Just copy, paste, and customize! 🚀**
