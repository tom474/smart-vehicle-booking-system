class JwtToken {
	public accessToken: string;
	public refreshToken: string;

	constructor(accessToken: string, refreshToken: string) {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
	}
}

export default JwtToken;
