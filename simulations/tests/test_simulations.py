import pytest
from simulations import __version__
from simulations.cap678 import best_option, get_options


def test_version():
    assert __version__ == "0.1.0"


def p(a=0, b=0, c=0):
    return {6: a, 7: b, 8: c}


@pytest.mark.parametrize(
    "raw_options, positions,expected",
    [
        [[[8, 8], [4, 7], [5, 6]], p(0, 0, 0), [[8, 8], [4, 7], [5, 6]]],
        [[[8, 8], [4, 7], [5, 6]], p(0, 0, 1), [[8, 8], [4, 7], [5, 6]]],
        [[[8, 8], [4, 7], [5, 6]], p(1, 0, 0), [[8, 8], [4, 7], [5, 6]]],
        [[[8, 8], [4, 7], [5, 6]], p(0, 1, 1), [[8, 8], [4, 7], [5], [6]]],
        [[[8, 8], [4, 7], [5, 6]], p(1, 1, 0), [[8, 8], [4, 7], [5, 6]]],
        [[[8, 8], [4, 7], [5, 6]], p(1, 1, 1), [[8, 8], [7], [6]]],
    ],
)
def test_get_options(raw_options, positions, expected):
    out = list(get_options(raw_options, positions))
    assert out == expected


@pytest.mark.parametrize(
    "options,positions,best",
    [
        [[[6], [8, 8]], {}, [8, 8]],
        [[[7, 7], [8, 8]], {}, [8, 8]],
        [[[7, 7], [8, 8]], {7: 3}, [7, 7]],
        [[[7, 7], [6, 7]], {}, [7, 7]],
        [[[7], [6, 8]], {}, [6, 8]],
        [[[7], [6, 8]], {6: 1, 8: 1}, [6, 8]],
        [[[7], [6]], {6: 1, 8: 1}, [6]],
        [[[7], [6]], {6: 1, 8: 1}, [6]],
        [[[7, 7], [6, 8], [7]], {6: 1, 8: 1}, [6, 8]],
        [[[7, 7], [6, 8], [7]], {6: 1}, [6, 8]],
        [[[7, 7], [6, 8], [7]], {7: 1}, [7, 7]],
        [[[7], [6, 6]], {7: 1}, [6, 6]],
        [[[6], [8, 7]], {6: 1, 7: 1, 8: 1}, [8, 7]],
        [[[6, 6], [7]], {6: 1, 7: 0, 8: 3}, [6, 6]],
        [[[7], [7], [6]], p(1, 2, 3), [6]],
    ],
)
def test_best_option(options, positions, best):
    for col in [6, 7, 8]:
        if col not in positions:
            positions[col] = 0
    assert best_option(options, positions) == best
