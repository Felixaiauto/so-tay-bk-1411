import os
import sys
import unittest
import urllib.request
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "tools"))
import img  # noqa: E402


class Stop(Exception):
    pass


class CommonsSkipTest(unittest.TestCase):
    def run_commons(self, credits):
        calls = []

        def fake_urlopen(req, timeout=None):
            calls.append(req.full_url)
            raise Stop()

        with mock.patch.object(urllib.request, "urlopen", fake_urlopen), mock.patch.object(img, "make") as make:
            try:
                img.commons({"credits": credits})
            except Stop:
                pass
        return calls, make

    def test_skips_personal_and_non_wikimedia_credits(self):
        credits = [
            {"file": "thien-dan-1", "url": "https://zhuanlan.zhihu.com/p/763708570", "personalUseOnly": True},
            {"file": "co-cung-1", "url": "https://example.com/page", "personalUseOnly": False},
            {"file": "no-url", "personalUseOnly": False},
        ]
        calls, make = self.run_commons(credits)
        self.assertEqual(calls, [])
        make.assert_not_called()

    def test_still_fetches_wikimedia_credit_that_is_not_personal(self):
        credits = [
            {"file": "thien-dan", "personalUseOnly": True, "url": "https://zhuanlan.zhihu.com/x"},
            {"file": "temple", "personalUseOnly": False,
             "url": "https://commons.wikimedia.org/wiki/File:Temple_of_Heaven_01.jpg"},
        ]
        calls, _ = self.run_commons(credits)
        self.assertEqual(len(calls), 1)
        self.assertIn("Temple_of_Heaven_01.jpg", calls[0])


if __name__ == "__main__":
    unittest.main()
