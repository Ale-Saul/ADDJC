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
- ✅ `certificacionService.test.ts` - Pruebas para el servicio de certificaciones (16 tests)

### Controladores
- ✅ `clubController.test.ts` - Pruebas para el controlador de clubes
- ✅ `senseiController.test.ts` - Pruebas para el controlador de senseis
- ✅ `judokaController.test.ts` - Pruebas para el controlador de judokas
- ✅ `arbitroController.test.ts` - Pruebas para el controlador de árbitros
- ✅ `certificacionController.test.ts` - Pruebas para el controlador de certificaciones (22 tests)

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

#### Componentes de Certificaciones
- ✅ `CertificacionForm.test.tsx` - Pruebas para formulario de certificación (19 tests)
- ✅ `CertificacionList.test.tsx` - Pruebas para lista de certificaciones (10 tests)

## Notas sobre los Mocks

Los servicios usan Supabase, por lo que se han creado mocks en `jest.setup.js` para:
- `@/lib/supabase` - Cliente de Supabase
- Operaciones de base de datos (select, insert, update, delete)
- Operaciones de storage (upload, delete)

### Mocks Especiales

#### CertificacionForm Tests
- **FileReader**: Se mockea FileReader para simular la lectura de archivos en tests
- **Validación de archivos**: Se prueban validaciones de tipo (PDF/imágenes) y tamaño (máximo 10MB)
- **MUI Select**: Los componentes Select de Material-UI se acceden mediante `getByRole('combobox')` debido a limitaciones de accesibilidad

## Resumen de Cobertura

### Total de Tests por Categoría
- **Servicios**: 6 archivos de prueba con 88+ tests
- **Controladores**: 5 archivos de prueba con 110+ tests
- **Componentes**: 15 archivos de prueba con 100+ tests

**Total**: ~300 tests implementados

