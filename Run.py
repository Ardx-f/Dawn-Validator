# Impor modul dan setup
import requests, time, urllib3, os
os.system('clear')
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# URL API
GET_POINTS_URL = "https://www.aeropres.in/api/atom/v1/userreferral/getpoint"
KEEPALIVE_URL = "https://www.aeropres.in/chromeapi/dawn/v1/userreward/keepalive"

# Fungsi untuk menampilkan pesan sambutan
def show_welcome():
    print("\033[95m")  # Warna teks ungu terang
    print(r"""
     (                                                                 
    )\ )                                  (     (           )         
    (()/(     ) (  (            (   (    ) )\(   )\ )   ) ( /(    (    
    /(_)) ( /( )\))(   (   ___ )\  )\( /(((_)\ (()/(( /( )\())(  )(   
    (_))_  )(_)|(_)()\  )\ )___((_)((_)(_))_((_) ((_))(_)|_))/ )\(()\  
    |   \((_)__(()((_)_(_/(   \ \ / ((_)_| |(_) _| ((_)_| |_ ((_)((_) 
    | |) / _` \ V  V / ' \))   \ V // _` | || / _` / _` |  _/ _ \ '_| 
    |___/\__,_|\_/\_/|_||_|     \_/ \__,_|_||_\__,_\__,_|\__\___/_|   
    """)
    print("\033[45;107m\033[35m Ardiyan Mahessa \033[0m")
    print("\033[0m")  # Reset warna default

# Fungsi membaca data dari file
def read_account_data(file_name):
    data = []
    with open(file_name, 'r') as file:
        for line in file:
            email, token = line.strip().split('|')
            data.append({'email': email, 'token': token})
    return data

# Fungsi menghitung poin total
def fetch_total_points(auth_headers):
    try:
        res = requests.get(GET_POINTS_URL, headers=auth_headers, verify=False)
        if res.status_code == 200 and res.json().get("status"):
            point_data = res.json()["data"]["rewardPoint"]
            referral_data = res.json()["data"]["referralPoint"]
            return (
                point_data.get("points", 0) +
                point_data.get("registerpoints", 0) +
                point_data.get("signinpoints", 0) +
                point_data.get("twitter_x_id_points", 0) +
                point_data.get("discordid_points", 0) +
                point_data.get("telegramid_points", 0) +
                point_data.get("bonus_points", 0) +
                referral_data.get("commission", 0)
            )
        elif res.status_code == 403:
            print(f"\033[41m\033[37mError 403 - Forbidden\033[0m")
        else:
            print(f"\033[41m\033[37mError Code:\033[95m {res.status_code}\033[0m")
    except requests.exceptions.RequestException as e:
        print(f"\033[37mError during fetching points:\033[95m {e}\033[0m")
    return 0

# Fungsi untuk permintaan keepalive
def execute_keepalive(auth_headers, email):
    keep_payload = {
        "username": email,
        "extensionid": "fpdkjdnhkakefebpekbdhillbhonfjjp",
        "numberoftabs": 0,
        "_v": "1.0.7"
    }
    try:
        response = requests.post(KEEPALIVE_URL, headers=auth_headers, json=keep_payload, verify=False)
        print(f"Status Code: \033[37m{response.status_code}\033[0m")
        if response.status_code == 200 and 'message' in response.json():
            print(f"\033[37mSuccess:\033[95m {response.json()['message']}\033[0m")
            return True
        elif response.status_code == 403:
            print(f"\033[37m403 Forbidden. Skipping {email}\033[0m")
        elif response.status_code == 502:
            print("\033[41m\033[37m502 Bad Gateway\033[0m")
        return False
    except requests.exceptions.RequestException as e:
        print(f"\033[41m\033[37mError occurred: {e}\033[0m")
        return False

# Fungsi hitung mundur
def delay_countdown(seconds):
    for sec in range(seconds, 0, -1):
        print(f"\033[37mRestarting in:\033[95m {sec} seconds\033[0m", end='\r')
        time.sleep(1)
    print("\n\033[37mProcess restarting...\033[0m\n")

# Fungsi utama
def main():
    show_welcome() 
    while True:
        accounts = read_account_data("user.txt")
        all_points = 0
        for account in accounts:
            email, token = account['email'], account['token']
            headers = {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en-US,en;q=0.9",
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            }
            print(f"\033[37mProcessing Account:\033[95m {email}\033[0m") 
            all_points += fetch_total_points(headers)
            if execute_keepalive(headers, email):
                print(f"\033[37mRequest Success for \033[95m{email}\033[0m\n")
            else:
                print(f"\033[41m\033[91mRequest Failed for {email}\033[0m\n")
        print(f"\033[37mAll Accounts Processed.\033[0m")
        print(f"\033[37mTotal Points for All Users:\033[95m {all_points}\033[0m")
        delay_countdown(100)

if __name__ == "__main__":
    main()
    