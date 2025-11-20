# Guía de Testing

Este proyecto incluye pruebas unitarias configuradas con Jest y React Testing Library.

## Configuración

Las dependencias de testing ya están instaladas:
- Jest
- React Testing Library
- @testing-library/jest-dom
- @testing-library/user-event

## Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar en modo watch (se re-ejecutan al cambiar archivos)
npm run test:watch

# Ejecutar con cobertura
npm run test:coverage
```

## Estructura de Pruebas

Las pruebas están organizadas en carpetas `__tests__` junto a los archivos que prueban:

```
src/
  services/
    __tests__/
      clubService.test.ts
      arbitroService.test.ts
  controllers/
    __tests__/
      clubController.test.ts
  components/
    __tests__/
      Sidebar.test.tsx
```

## Pruebas Implementadas

### Servicios
- ✅ `clubService.test.ts` - Pruebas para el servicio de clubes
- ✅ `arbitroService.test.ts` - Pruebas para el servicio de árbitros

### Controladores
- ✅ `clubController.test.ts` - Pruebas para el controlador de clubes

### Componentes
- ✅ `Sidebar.test.tsx` - Pruebas para el componente Sidebar

## Notas sobre los Mocks

Los servicios usan Supabase, por lo que se han creado mocks en `jest.setup.js` para:
- `@/lib/supabase` - Cliente de Supabase
- Operaciones de base de datos (select, insert, update, delete)
- Operaciones de storage (upload, delete)

## Próximos Pasos

Para completar la cobertura de pruebas, se recomienda agregar:

1. **Servicios restantes:**
   - `senseiService.test.ts`
   - `judokaService.test.ts`
   - `certificacionService.test.ts`
   - `userService.test.ts`

2. **Controladores restantes:**
   - `arbitroController.test.ts`
   - `senseiController.test.ts`
   - `judokaController.test.ts`
   - `certificacionController.test.ts`

3. **Componentes principales:**
   - `ClubForm.test.tsx`
   - `ArbitroForm.test.tsx`
   - `SenseiForm.test.tsx`
   - `JudokaForm.test.tsx`
   - `CertificacionForm.test.tsx`

## Solución de Problemas

Si encuentras errores de mocks, verifica que:
1. Los mocks en `jest.setup.js` coincidan con la estructura real de Supabase
2. Los métodos encadenados (`.from().select().order()`) estén correctamente mockeados
3. Los valores de retorno de los mocks coincidan con lo que espera el código

