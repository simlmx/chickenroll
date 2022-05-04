"""
Script to calculate the odds of finishing a column in one go, when on 6-7-8.
"""

import sys
import time
import math
from random import randint


def die():
    return randint(1, 6)


def roll():
    return [die() for _ in range(4)]


def get_raw_options(dice):
    """Given 4 dice return the 3 pairs of sums."""
    a, b, c, d = dice
    return [
        [a + b, c + d],
        [a + c, b + d],
        [a + d, b + c],
    ]


def get_options(raw_options, positions):
    """Split/filter the options depending of the current positions."""
    climbing = [p for p in positions if positions[p] > 0]
    num_climbers = len(climbing)

    for option in raw_options:
        if num_climbers in [0, 1]:
            yield option
        elif num_climbers == 2:
            if (
                option[0] not in climbing
                and option[1] not in climbing
                and option[0] != option[1]
            ):
                yield [option[0]]
                yield [option[1]]
            else:
                yield option
        else:
            assert num_climbers == 3
            if option[0] in climbing and option[1] in climbing:
                yield option
            elif option[0] in climbing:
                yield [option[0]]
            elif option[1] in climbing:
                yield [option[1]]


def all_678(option):
    """All the choices in the option are either 6, 7 or 8."""
    for x in option:
        if x not in [6, 7, 8]:
            return False
    return True


def col_height(col):
    """Get the number of steps for a column."""
    assert col in [6, 7, 8]
    if col == 7:
        return 13
    return 11


def move(positions, option):
    """Returns an updated positions assuming to choose option `option`."""
    p = dict(positions)
    for opt in option:
        p[opt] += 1
    return p


def fitness(positions):
    """How good is the positions."""
    return (
        # We priorize having any column as high as possible (relatively speaking).
        max([positions[col] / col_height(col) for col in positions]),
        # In case of equality we want the overall "progress" to be as big as possible.
        sum([positions[col] / col_height(col) for col in positions]),
    )


def best_option(options, positions):
    """Given a list of options, which is the best."""
    # It's simply the one that gets us in the position with the best fitness.
    return list(
        sorted(
            options,
            key=lambda option: fitness(move(positions, option)),
        )
    )[-1]


def position_str(n, m):
    s = f"{n}|"
    if not m:
        return s

    if m < 10:
        s += "*" * (m - 1) + str(m)
    else:
        s += "*" * (m - 2) + str(m)

    return s


def try_to_cap_678(verbose=False):
    """Run one experiment where we try to cap.

    We return
        * "ignore" if we did not manage to climb 6-7-8.
        * "bust" if we busted on 6-7-8.
        * "success" if we capped one of 6-7-8.
    """

    positions = {6: 0, 7: 0, 8: 0}

    if verbose:
        print("-----------")

    first = True
    while True:
        dice = roll()
        raw_options = get_raw_options(dice)
        options = list(get_options(raw_options, positions))

        if verbose:
            print(f"Dice:\n {dice}")
            print(f"Raw options:\n {raw_options}")
            print(f"Options:\n {options}")

        # If there are no options it means we bust.
        if len(options) == 0:
            return "bust"

        # Filter the options that are not all 6-7-8
        options = [opt for opt in options if all_678(opt)]

        # If there are no options left it means we had to play a non-6-7-8.
        # We ignore those cases.
        if len(options) == 0:
            return "ignore"

        option = best_option(options, positions=positions)

        if verbose:
            print(f"Filtered options\n {options}")
            print(f"Best option:\n {option}")

        for col in option:
            positions[col] += 1

        if verbose:
            for n in [6, 7, 8]:
                print(" " * 20 + position_str(n, positions[n]))

        # >= because going further is fine: if means that we could finish it anyway.
        for col in [6, 7, 8]:
            if positions[col] >= col_height(col):
                return "success"

        if verbose:
            input("")
        first = False


def main(verbose):
    n_try = 0
    n_success = 0

    # Run many experiments and count the successes.
    for i in range(10000000):
        result = try_to_cap_678(verbose)
        if verbose:
            print(f"Result: {result}")
        if result != "ignore":
            n_try += 1
        if result == "success":
            n_success += 1

        if n_try:
            p = n_success / n_try
            q = 1 - p
            err = 1.96 * math.sqrt(p * q / n_try)

        if n_try and (i % 1000 == 0 or verbose):
            print(f"{n_try:10} - Odds: {p} ± {err}")

        if verbose:
            input("Press anything to run again ")


if __name__ == "__main__":
    main(verbose=len(sys.argv) > 1)
