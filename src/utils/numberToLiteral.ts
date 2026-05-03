/**
 * Convierte un número en su representación literal en español
 * Adaptado para moneda: Bolivianos
 */
export const numeroALiteral = (n: number): string => {
  const unidades = ['Cero', 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve']
  const decenas = [
    'Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve',
    'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'
  ]
  const centenas = ['Cien', 'Cientos', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos']

  const convertirGrupo = (n: number): string => {
    let output = ''

    if (n >= 100) {
      if (n === 100) return 'Cien '
      output += centenas[Math.floor(n / 100)] + ' '
      n %= 100
    }

    if (n >= 20) {
      output += decenas[Math.floor(n / 10) + 8] + ' '
      n %= 10
      if (n > 0) output += 'y '
    } else if (n >= 10) {
      output += decenas[n - 10] + ' '
      return output
    }

    if (n > 0) {
      output += unidades[n] + ' '
    }

    return output
  }

  if (n === 0) return 'Cero'

  const entero = Math.floor(n)
  const centavos = Math.round((n - entero) * 100)

  let literal = ''
  let num = entero

  if (num >= 1000000) {
    const millones = Math.floor(num / 1000000)
    literal += (millones === 1 ? 'Un Millón ' : convertirGrupo(millones) + 'Millones ')
    num %= 1000000
  }

  if (num >= 1000) {
    const miles = Math.floor(num / 1000)
    literal += (miles === 1 ? 'Mil ' : convertirGrupo(miles) + 'Mil ')
    num %= 1000
  }

  if (num > 0) {
    literal += convertirGrupo(num)
  }

  const centavosTexto = centavos.toString().padStart(2, '0') + '/100'
  return `${literal.trim()} ${centavosTexto} Bolivianos`.toUpperCase()
}
