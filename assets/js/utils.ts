export const reduceSigFigs = (value) => {
    return Math.round(value * 100000) / 100000
}