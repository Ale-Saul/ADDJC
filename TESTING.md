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
- ✅ `senseiService.test.ts` - Pruebas para el servicio de senseis 
- ✅ `judokaService.test.ts` - Pruebas para el servicio de judokas
- ✅ `userService.test.ts` - Pruebas para el servicio de usuarios (12 tests)

### Controladores
- ✅ `clubController.test.ts` - Pruebas para el controlador de clubes
- ✅ `senseiController.test.ts` - Pruebas para el controlador de senseis
- ✅ `judokaController.test.ts` - Pruebas para el controlador de judokas
- ✅ `arbitroController.test.ts` - Pruebas para el controlador de árbitros

### Componentes

#### Componentes Comunes
- ✅ `Sidebar.test.tsx` - Pruebas para el componente Sidebar

#### Componentes de Senseis
- ✅ `SenseiCard.test.tsx` - Pruebas para tarjeta de sensei
- ✅ `SenseiForm.test.tsx` - Pruebas para formulario de sensei 
- ✅ `SenseiList.test.tsx` - Pruebas para lista de senseis

#### Componentes de Judokas
- ✅ `JudokaCard.test.tsx` - Pruebas para tarjeta de judoka
- ✅ `JudokaForm.test.tsx` - Pruebas para formulario de judoka
- ✅ `JudokaList.test.tsx` - Pruebas para lista de judokas

#### Componentes de Árbitros
- ✅ `ArbitroCard.test.tsx` - Pruebas para tarjeta de árbitro
- ✅ `ArbitroForm.test.tsx` - Pruebas para formulario de árbitro
- ✅ `ArbitroList.test.tsx` - Pruebas para lista de árbitros

#### Componentes de Clubes
- ✅ `ClubCard.test.tsx` - Pruebas para tarjeta de club (3 tests)
- ✅ `ClubForm.test.tsx` - Pruebas para formulario de club (6 tests)
- ✅ `ClubList.test.tsx` - Pruebas para lista de clubes (3 tests)

## Notas sobre los Mocks

Los servicios usan Supabase, por lo que se han creado mocks en `jest.setup.js` para:
- `@/lib/supabase` - Cliente de Supabase
- Operaciones de base de datos (select, insert, update, delete)
- Operaciones de storage (upload, delete)

## Próximos Pasos

Para completar la cobertura de pruebas, se recomienda agregar:

1. **Servicios restantes:**
   - `certificacionService.test.ts`

2. **Controladores restantes:**
   - `certificacionController.test.ts`

3. **Componentes de Certificaciones:**
   - `CertificacionForm.test.tsx`
   - `CertificacionList.test.tsx`
