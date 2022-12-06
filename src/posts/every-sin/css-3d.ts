import { Matrix } from 'three'

function epsilon(value: number) {
    return Math.abs(value) < 1e-10 ? 0 : value
}

export function getCameraCSSMatrix({ elements }: Matrix) {
    return (
        'matrix3d(' +
        epsilon(elements[0]) +
        ',' +
        epsilon(-elements[1]) +
        ',' +
        epsilon(elements[2]) +
        ',' +
        epsilon(elements[3]) +
        ',' +
        epsilon(elements[4]) +
        ',' +
        epsilon(-elements[5]) +
        ',' +
        epsilon(elements[6]) +
        ',' +
        epsilon(elements[7]) +
        ',' +
        epsilon(elements[8]) +
        ',' +
        epsilon(-elements[9]) +
        ',' +
        epsilon(elements[10]) +
        ',' +
        epsilon(elements[11]) +
        ',' +
        epsilon(elements[12]) +
        ',' +
        epsilon(-elements[13]) +
        ',' +
        epsilon(elements[14]) +
        ',' +
        epsilon(elements[15]) +
        ')'
    )
}
