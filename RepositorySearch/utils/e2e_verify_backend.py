#!/usr/bin/env python3
import json
import sys
import urllib.parse
import urllib.request

BASE = "http://localhost:3001"

def get(path, params=None):
    if params:
        q = urllib.parse.urlencode(params)
        url = f"{BASE}{path}?{q}"
    else:
        url = f"{BASE}{path}"
    req = urllib.request.Request(url, method="GET", headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read().decode("utf-8")
            ct = resp.headers.get("content-type","")
            return resp.status, ct, data
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("content-type",""), e.read().decode("utf-8", errors="replace")
    except Exception as e:
        return 0, "", str(e)

def main():
    print("E2E Backend API Verification")
    # 1) search
    status, ct, body = get("/search", {
        "q":"react","page":1,"page_size":10,"sort_by":"stars","sort_dir":"desc"
    })
    print(f"[SEARCH] status={status} content-type={ct}")
    if status == 200:
        try:
            data = json.loads(body)
            ok = all(k in data for k in ("items","total","page","page_size"))
            print(f"  Schema ok: {ok}, items={len(data.get('items',[]))}, total={data.get('total')}")
        except Exception as e:
            print(f"  JSON parse error: {e}")
    else:
        print(f"  Error body: {body[:400]}")
        sys.exit(1)

    first_full_name = None
    try:
        first_full_name = json.loads(body)["items"][0]["full_name"]
    except Exception:
        pass

    # 2) repository detail (if we have a full_name)
    if first_full_name:
        safe = urllib.parse.quote(first_full_name, safe="")
        status2, ct2, body2 = get(f"/repositories/{safe}")
        print(f"[DETAIL] repo={first_full_name} status={status2} content-type={ct2}")
        if status2 == 200:
            try:
                d = json.loads(body2)
                required = ["id","name","full_name","html_url","stargazers_count","forks_count","open_issues_count"]
                ok = all(k in d for k in required)
                print(f"  Schema ok: {ok}, language={d.get('language')}, license={d.get('license')}")
            except Exception as e:
                print(f"  JSON parse error: {e}")
        else:
            print(f"  Error body: {body2[:400]}")

    # 3) analytics
    status3, ct3, body3 = get("/analytics", {
        "q":"react","page_size":10,"sort_by":"stars","sort_dir":"desc"
    })
    print(f"[ANALYTICS] status={status3} content-type={ct3}")
    if status3 == 200:
        try:
            a = json.loads(body3)
            required = ["total_repositories","total_stars","total_forks","language_breakdown"]
            ok = all(k in a for k in required)
            print(f"  Schema ok: {ok}, total_repositories={a.get('total_repositories')}")
        except Exception as e:
            print(f"  JSON parse error: {e}")
    else:
        print(f"  Error body: {body3[:400]}")

if __name__ == "__main__":
    main()
