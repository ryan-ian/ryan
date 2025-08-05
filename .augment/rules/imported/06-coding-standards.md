---
type: "always_apply"
---

# Coding Standards and Best Practices

This document outlines the coding standards and best practices to follow when developing the Conference Hub application. Adhering to these standards ensures code consistency, maintainability, and quality.

## General Principles

- **DRY (Don't Repeat Yourself)** - Avoid code duplication by creating reusable components and functions
- **KISS (Keep It Simple, Stupid)** - Prefer simple, readable solutions over complex ones
- **YAGNI (You Aren't Gonna Need It)** - Don't implement features until they're needed
- **Single Responsibility Principle** - Each component or function should have a single responsibility

## TypeScript Standards

### Type Definitions

- Always define proper types for variables, function parameters, and return values
- Use interfaces for complex objects and type aliases for unions and primitives
- Export types from the `/types` directory for shared models
- Avoid using `any` type; use `unknown` if the type is truly unknown

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// Bad
function getUser(id): Promise<any> {
  // ...
}
```

### Naming Conventions

- Use `PascalCase` for types, interfaces, and React components
- Use `camelCase` for variables, functions, and methods
- Use `UPPER_SNAKE_CASE` for constants
- Use descriptive names that indicate purpose

```typescript
// Good
interface BookingRequest {
  roomId: string;
  startTime: Date;
}

const MAX_BOOKING_DURATION = 240; // minutes

function createBooking(request: BookingRequest): Promise<Booking> {
  // ...
}

// Bad
interface data {
  r: string;
  s: Date;
}

const max = 240;

function process(d: data): Promise<any> {
  // ...
}
```

## React and Next.js Standards

### Component Structure

- Use functional components with hooks instead of class components
- Split large components into smaller, focused components
- Keep components in appropriate directories based on their purpose
- Use proper file naming conventions:
  - Components: `ComponentName.tsx`
  - Hooks: `use-hook-name.ts`
  - Utilities: `utility-name.ts`

### Component Organization

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Type definitions specific to this component
interface Props {
  initialData: SomeType;
}

// 3. Component definition
export default function ComponentName({ initialData }: Props) {
  // 4. Hooks
  const router = useRouter();
  const [data, setData] = useState(initialData);
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 6. Event handlers and other functions
  const handleSubmit = () => {
    // Handler logic
  };
  
  // 7. Render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}
```

### State Management

- Use React's built-in state management (useState, useReducer) for component state
- Use React Context for global state that needs to be accessed by multiple components
- Keep state as local as possible to the components that need it
- Avoid prop drilling by using context or custom hooks

## API and Data Access

### API Functions

- Group API functions by resource type
- Include proper error handling in all API calls
- Use consistent patterns for API responses
- Document API functions with JSDoc comments

```typescript
/**
 * Fetches a room by its ID
 * @param id - The room ID
 * @returns The room object or null if not found
 */
export async function getRoomById(id: string): Promise<Room | null> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching room ${id}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getRoomById:', error);
    throw error;
  }
}
```

### Error Handling

- Use try/catch blocks for error handling in async functions
- Log errors with appropriate context information
- Return meaningful error messages to the UI
- Handle different types of errors appropriately (network errors, validation errors, etc.)

## UI and Styling

### Component Library

- Use Shadcn UI components as the foundation for UI elements
- Extend components as needed rather than creating from scratch
- Follow the component library's patterns and conventions

### CSS and Styling

- Use Tailwind CSS for styling
- Follow utility-first CSS approach
- Use consistent spacing and sizing
- Create reusable UI patterns for common elements
- Use CSS variables for theme colors and values

```tsx
// Good
<div className="flex items-center p-4 space-x-2 bg-background rounded-md">
  <Button variant="outline">Cancel</Button>
  <Button>Submit</Button>
</div>

// Bad
<div style={{ display: 'flex', padding: '16px', backgroundColor: '#f9f9f9' }}>
  <button className="cancelBtn">Cancel</button>
  <button className="submitBtn">Submit</button>
</div>
```

## Testing

### Unit Testing

- Write tests for critical business logic
- Test components in isolation
- Mock external dependencies
- Focus on behavior, not implementation details

### Integration Testing

- Test key user flows
- Ensure components work together correctly
- Test API integrations with proper mocking

## Documentation

### Code Comments

- Use JSDoc comments for functions and complex logic
- Comment "why" rather than "what" when the code isn't self-explanatory
- Keep comments up-to-date with code changes

### Component Documentation

- Document props and their types
- Include usage examples for complex components
- Document any non-obvious behaviors or side effects

## Performance Considerations

- Use proper React optimization techniques (useMemo, useCallback, memo)
- Optimize database queries for performance
- Implement pagination for large data sets
- Use appropriate caching strategies
- Optimize images and assets

## Security Best Practices

- Validate all user inputs
- Implement proper authentication checks
- Follow OWASP security guidelines
- Don't expose sensitive information in client-side code
- Use proper CORS policies

## Git and Version Control

- Write clear, descriptive commit messages
- Use feature branches for new development
- Keep commits focused and atomic
- Perform code reviews before merging

By following these coding standards and best practices, we ensure that the Conference Hub application remains maintainable, scalable, and of high quality as it evolves. # Coding Standards and Best Practices

This document outlines the coding standards and best practices to follow when developing the Conference Hub application. Adhering to these standards ensures code consistency, maintainability, and quality.

## General Principles

- **DRY (Don't Repeat Yourself)** - Avoid code duplication by creating reusable components and functions
- **KISS (Keep It Simple, Stupid)** - Prefer simple, readable solutions over complex ones
- **YAGNI (You Aren't Gonna Need It)** - Don't implement features until they're needed
- **Single Responsibility Principle** - Each component or function should have a single responsibility

## TypeScript Standards

### Type Definitions

- Always define proper types for variables, function parameters, and return values
- Use interfaces for complex objects and type aliases for unions and primitives
- Export types from the `/types` directory for shared models
- Avoid using `any` type; use `unknown` if the type is truly unknown

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// Bad
function getUser(id): Promise<any> {
  // ...
}
```

### Naming Conventions

- Use `PascalCase` for types, interfaces, and React components
- Use `camelCase` for variables, functions, and methods
- Use `UPPER_SNAKE_CASE` for constants
- Use descriptive names that indicate purpose

```typescript
// Good
interface BookingRequest {
  roomId: string;
  startTime: Date;
}

const MAX_BOOKING_DURATION = 240; // minutes

function createBooking(request: BookingRequest): Promise<Booking> {
  // ...
}

// Bad
interface data {
  r: string;
  s: Date;
}

const max = 240;

function process(d: data): Promise<any> {
  // ...
}
```

## React and Next.js Standards

### Component Structure

- Use functional components with hooks instead of class components
- Split large components into smaller, focused components
- Keep components in appropriate directories based on their purpose
- Use proper file naming conventions:
  - Components: `ComponentName.tsx`
  - Hooks: `use-hook-name.ts`
  - Utilities: `utility-name.ts`

### Component Organization

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Type definitions specific to this component
interface Props {
  initialData: SomeType;
}

// 3. Component definition
export default function ComponentName({ initialData }: Props) {
  // 4. Hooks
  const router = useRouter();
  const [data, setData] = useState(initialData);
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 6. Event handlers and other functions
  const handleSubmit = () => {
    // Handler logic
  };
  
  // 7. Render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}
```

### State Management

- Use React's built-in state management (useState, useReducer) for component state
- Use React Context for global state that needs to be accessed by multiple components
- Keep state as local as possible to the components that need it
- Avoid prop drilling by using context or custom hooks

## API and Data Access

### API Functions

- Group API functions by resource type
- Include proper error handling in all API calls
- Use consistent patterns for API responses
- Document API functions with JSDoc comments

```typescript
/**
 * Fetches a room by its ID
 * @param id - The room ID
 * @returns The room object or null if not found
 */
export async function getRoomById(id: string): Promise<Room | null> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching room ${id}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getRoomById:', error);
    throw error;
  }
}
```

### Error Handling

- Use try/catch blocks for error handling in async functions
- Log errors with appropriate context information
- Return meaningful error messages to the UI
- Handle different types of errors appropriately (network errors, validation errors, etc.)

## UI and Styling

### Component Library

- Use Shadcn UI components as the foundation for UI elements
- Extend components as needed rather than creating from scratch
- Follow the component library's patterns and conventions

### CSS and Styling

- Use Tailwind CSS for styling
- Follow utility-first CSS approach
- Use consistent spacing and sizing
- Create reusable UI patterns for common elements
- Use CSS variables for theme colors and values

```tsx
// Good
<div className="flex items-center p-4 space-x-2 bg-background rounded-md">
  <Button variant="outline">Cancel</Button>
  <Button>Submit</Button>
</div>

// Bad
<div style={{ display: 'flex', padding: '16px', backgroundColor: '#f9f9f9' }}>
  <button className="cancelBtn">Cancel</button>
  <button className="submitBtn">Submit</button>
</div>
```

## Testing

### Unit Testing

- Write tests for critical business logic
- Test components in isolation
- Mock external dependencies
- Focus on behavior, not implementation details

### Integration Testing

- Test key user flows
- Ensure components work together correctly
- Test API integrations with proper mocking

## Documentation

### Code Comments

- Use JSDoc comments for functions and complex logic
- Comment "why" rather than "what" when the code isn't self-explanatory
- Keep comments up-to-date with code changes

### Component Documentation

- Document props and their types
- Include usage examples for complex components
- Document any non-obvious behaviors or side effects

## Performance Considerations

- Use proper React optimization techniques (useMemo, useCallback, memo)
- Optimize database queries for performance
- Implement pagination for large data sets
- Use appropriate caching strategies
- Optimize images and assets

## Security Best Practices

- Validate all user inputs
- Implement proper authentication checks
- Follow OWASP security guidelines
- Don't expose sensitive information in client-side code
- Use proper CORS policies

## Git and Version Control

- Write clear, descriptive commit messages
- Use feature branches for new development
- Keep commits focused and atomic
- Perform code reviews before merging

By following these coding standards and best practices, we ensure that the Conference Hub application remains maintainable, scalable, and of high quality as it evolves. 