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
- ✅ `clubService.test.ts` - Pruebas para el servicio de clubes (19 pruebas)
- ✅ `arbitroService.test.ts` - Pruebas para el servicio de árbitros (19 pruebas)
- ✅ `senseiService.test.ts` - Pruebas para el servicio de senseis (19 pruebas)
  - CRUD completo (crear, leer, actualizar, eliminar)
  - Filtrado por club
  - Restauración de registros eliminados
  - Manejo de errores y validaciones

### Controladores
- ✅ `clubController.test.ts` - Pruebas para el controlador de clubes
- ✅ `senseiController.test.ts` - Pruebas para el controlador de senseis
  - Validaciones de entrada de datos
  - Verificación de IDs requeridos
  - Manejo de errores de servicio
  - Reglas de negocio

### Componentes

#### Componentes Comunes
- ✅ `Sidebar.test.tsx` - Pruebas para el componente Sidebar

#### Componentes de Senseis
- ✅ `SenseiCard.test.tsx` - Pruebas para tarjeta de sensei (13 pruebas)
  - Renderizado de información del sensei
  - Manejo de estados activo/inactivo
  - Manejo de campos opcionales
  - Interacciones de usuario (onClick)
  - Estilos dinámicos (cursor pointer/default)

- ✅ `SenseiForm.test.tsx` - Pruebas para formulario de sensei (16 pruebas)
  - Renderizado de campos del formulario
  - Carga de datos en modo edición
  - Validaciones de formulario
  - Creación y actualización de senseis
  - Manejo de estados de carga
  - Integración con Material-UI Select components
  - Manejo de errores

- ✅ `SenseiList.test.tsx` - Pruebas para lista de senseis (17 pruebas)
  - Renderizado de tabla
  - Manejo de estados de carga
  - Filtrado por club
  - Callbacks de acciones (editar, eliminar)
  - Manejo de errores
  - Refresh automático
  - Estados vacíos

## Notas sobre los Mocks

Los servicios usan Supabase, por lo que se han creado mocks en `jest.setup.js` para:
- `@/lib/supabase` - Cliente de Supabase
- Operaciones de base de datos (select, insert, update, delete)
- Operaciones de storage (upload, delete)

## Próximos Pasos

Para completar la cobertura de pruebas, se recomienda agregar:

1. **Servicios restantes:**
   - `judokaService.test.ts`
   - `certificacionService.test.ts`
   - `userService.test.ts`

2. **Controladores restantes:**
   - `arbitroController.test.ts`
   - `judokaController.test.ts`
   - `certificacionController.test.ts`

3. **Componentes de Árbitros:**
   - `ArbitroCard.test.tsx`
   - `ArbitroForm.test.tsx`
   - `ArbitroList.test.tsx`

4. **Componentes de Clubes:**
   - `ClubCard.test.tsx`
   - `ClubForm.test.tsx`
   - `ClubList.test.tsx`

5. **Componentes de Judokas:**
   - `JudokaCard.test.tsx`
   - `JudokaForm.test.tsx`
   - `JudokaList.test.tsx`

6. **Componentes de Certificaciones:**
   - `CertificacionForm.test.tsx`
   - `CertificacionList.test.tsx`

## Solución de Problemas

### Problemas Comunes y Soluciones

#### 1. Errores de Mocks de Supabase
Si encuentras errores de mocks, verifica que:
- Los mocks en `jest.setup.js` coincidan con la estructura real de Supabase
- Los métodos encadenados (`.from().select().order()`) estén correctamente mockeados
- Los valores de retorno de los mocks coincidan con lo que espera el código

**Ejemplo de mock correcto para query chain:**
```javascript
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
});
```

#### 2. Errores con Material-UI Select Components
Los componentes `Select` de Material-UI requieren un enfoque especial para testing:

- **Usar `document.getElementById()`** en lugar de `getByRole()` para selectores con IDs específicos
- **Usar `getAllByText()[0]`** cuando hay elementos duplicados (label y legend)
- **Usar `fireEvent.mouseDown()`** para abrir el Select antes de seleccionar opciones

**Ejemplo:**
```javascript
const selectElement = document.getElementById('mui-component-select-club_id');
fireEvent.mouseDown(selectElement!);
await waitFor(() => {
  expect(screen.getByText('Option 1')).toBeInTheDocument();
});
```

#### 3. Timeouts en Pruebas Asíncronas
Si las pruebas fallan por timeout:
- Asegúrate de que los mocks retornen Promises con `.mockResolvedValue()`
- Usa `await waitFor()` para operaciones asíncronas
- Aumenta el timeout si es necesario: `jest.setTimeout(10000)`

#### 4. Warnings de Valores Controlados/No Controlados
Para evitar warnings sobre inputs controlados:
- Inicializa siempre los valores del formulario (usar `''` en lugar de `null` o `undefined`)
- Usa `user.clear()` seguido de `user.type()` en lugar de modificar directamente el valor

## Estadísticas de Testing

### Cobertura Actual
- **Total de pruebas:** 65+ pruebas pasando
- **Módulos completamente testeados:** Senseis, Clubes (parcial), Árbitros (parcial)
- **Cobertura de servicios:** 3/5 servicios (60%)
- **Cobertura de controladores:** 2/5 controladores (40%)
- **Cobertura de componentes:** Senseis completo (3/3 componentes)

### Pruebas por Módulo

#### Senseis (✅ Completo)
- Service: 19 pruebas
- Controller: Todas las validaciones
- SenseiCard: 13 pruebas
- SenseiForm: 16 pruebas
- SenseiList: 17 pruebas
- **Total:** 65+ pruebas

#### Clubes (⚠️ Parcial)
- Service: 19 pruebas
- Controller: Todas las validaciones
- Componentes: Pendientes

#### Árbitros (⚠️ Parcial)
- Service: 19 pruebas
- Componentes: Pendientes

## Mejores Prácticas Aplicadas

1. **Organización:** Tests en carpetas `__tests__` junto al código
2. **Nomenclatura:** Archivos `.test.ts` o `.test.tsx`
3. **Estructura:** Describe blocks para agrupar pruebas relacionadas
4. **Mocking:** Mocks centralizados en `jest.setup.js`
5. **Assertions:** Uso de matchers específicos de `@testing-library/jest-dom`
6. **User Events:** Uso de `@testing-library/user-event` para simular interacciones reales
7. **Async Testing:** Uso correcto de `waitFor` para operaciones asíncronas
8. **Cleanup:** Limpieza automática entre pruebas con `afterEach`

